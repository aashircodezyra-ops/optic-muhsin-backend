const User = require('../models/User');
const Membership = require('../models/Membership');
const { translate } = require('../utils/translations');
const { calculateVIPExpiry } = require('../utils/helpers');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendConflict,
} = require('../utils/responseHandler');

// Initialize Stripe (only if secret key is provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Get VIP plans
const getVIPPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'monthly',
        name: 'Monthly Plan',
        duration: '1 month',
        price: 9.99,
        currency: 'USD',
      },
      {
        id: '3months',
        name: '3 Months Plan',
        duration: '3 months',
        price: 24.99,
        currency: 'USD',
        discount: 'Save 17%',
      },
      {
        id: 'yearly',
        name: 'Yearly Plan',
        duration: '1 year',
        price: 79.99,
        currency: 'USD',
        discount: 'Save 33%',
      },
    ];

    return sendSuccess(res, { plans }, 'VIP plans retrieved successfully');
  } catch (error) {
    console.error('[VIPController] Error fetching VIP plans:', error);
    return sendError(res, error.message || 'Failed to fetch VIP plans', 500);
  }
};

// Create payment intent (Stripe)
const createPaymentIntent = async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;
    const userId = req.user._id;

    // In production, integrate with Stripe/PayPal here
    // This is just the structure
    const paymentData = {
      userId,
      plan,
      paymentMethod,
      amount: getPlanPrice(plan),
      status: 'pending',
    };

    res.json({
      success: true,
      message: 'Payment intent created',
      data: paymentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || translate('error.server', req.query.lang || 'en'),
    });
  }
};

// Activate VIP (called after successful payment)
const activateVIP = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id;

    // Validate plan
    if (!plan) {
      return sendValidationError(res, 'VIP plan is required');
    }

    const validPlans = ['monthly', '3months', 'yearly'];
    if (!validPlans.includes(plan)) {
      return sendValidationError(res, `Invalid VIP plan. Must be one of: ${validPlans.join(', ')}`);
    }

    const expiryDate = calculateVIPExpiry(plan);
    if (!expiryDate) {
      return sendValidationError(res, 'Invalid VIP plan');
    }

    // Find or create membership
    let membership = await Membership.findOne({ userId });
    
    if (membership) {
      // Update existing membership
      membership.vipStatus = true;
      membership.vipExpiry = expiryDate;
      membership.vipPlan = plan;
      membership.lastPaymentDate = new Date();
      await membership.save();
    } else {
      // Create new membership
      membership = await Membership.create({
        userId,
        vipStatus: true,
        vipExpiry: expiryDate,
        vipPlan: plan,
        lastPaymentDate: new Date(),
      });
    }

    // Sync with User model for backward compatibility
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isVIP: true,
        vipExpiryDate: expiryDate,
        vipExpiresAt: expiryDate,
        vipExpiry: expiryDate,
        vipPlan: plan,
      },
      { new: true }
    );

    console.log(`[VIPController] VIP activated for user: ${userId}, plan: ${plan}`);
    return sendSuccess(
      res,
      {
        membership: {
          id: membership._id,
          userId: membership.userId,
          vipStatus: membership.vipStatus,
          vipExpiry: membership.vipExpiry,
          vipPlan: membership.vipPlan,
        },
        user: {
          id: user._id,
          isVIP: user.isVIP,
          vipExpiryDate: user.vipExpiryDate,
          vipPlan: user.vipPlan,
        },
      },
      'VIP membership activated successfully'
    );
  } catch (error) {
    console.error('[VIPController] Error activating VIP:', error);
    return sendError(res, error.message || 'Failed to activate VIP', 500);
  }
};

// Get VIP status
const getVIPStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check Membership model first
    let membership = await Membership.findOne({ userId });
    
    // If no membership exists, check User model for backward compatibility
    if (!membership) {
      const user = await User.findById(userId);
      if (user && (user.isVIP || user.vipExpiryDate)) {
        // Create membership from User data for migration
        membership = await Membership.create({
          userId,
          vipStatus: user.isVIP || false,
          vipExpiry: user.vipExpiryDate || user.vipExpiresAt || user.vipExpiry,
          vipPlan: user.vipPlan || 'none',
        });
      } else {
        return res.json({
          success: true,
          data: {
            isVIP: false,
            vipExpiryDate: null,
            vipExpiry: null,
            vipPlan: 'none',
            isActive: false,
            daysRemaining: 0,
          },
        });
      }
    }

    const isActive = membership.isActive();
    const daysRemaining = membership.getDaysRemaining();

    return sendSuccess(
      res,
      {
        isVIP: membership.vipStatus,
        vipExpiryDate: membership.vipExpiry,
        vipExpiry: membership.vipExpiry,
        vipPlan: membership.vipPlan,
        isActive,
        daysRemaining,
        paymentProvider: membership.paymentProvider,
        lastPaymentDate: membership.lastPaymentDate,
      },
      'VIP status retrieved successfully'
    );
  } catch (error) {
    console.error('[VIPController] Error getting VIP status:', error);
    return sendError(res, error.message || 'Failed to get VIP status', 500);
  }
};

// Create payment session (Stripe/PayPal)
const createSession = async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;
    const userId = req.user._id;

    // Validate plan
    if (!plan) {
      return sendValidationError(res, 'VIP plan is required');
    }

    if (!['monthly', '3months', 'yearly'].includes(plan)) {
      return sendValidationError(res, 'Invalid VIP plan. Must be: monthly, 3months, or yearly');
    }

    // Validate payment method
    if (!paymentMethod) {
      return sendValidationError(res, 'Payment method is required');
    }

    if (!['stripe', 'paypal'].includes(paymentMethod)) {
      return sendValidationError(res, 'Invalid payment method. Must be: stripe or paypal');
    }

    const amount = getPlanPrice(plan);
    const expiryDate = calculateVIPExpiry(plan);

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid VIP plan',
      });
    }

    // Check if user already has an active membership
    let membership = await Membership.findOne({ userId });
    if (membership && membership.isActive()) {
      return sendConflict(res, 'You already have an active VIP membership');
    }

    // Get frontend URL for redirects
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create Stripe Checkout Session if Stripe is configured
    if (paymentMethod === 'stripe' && stripe) {
      try {
        const planName = plan === 'monthly' ? 'Monthly VIP' : 
                        plan === '3months' ? '3 Months VIP' : 
                        'Yearly VIP';

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: planName,
                  description: `VIP Membership - ${planName}`,
                },
                unit_amount: Math.round(amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${frontendUrl}/vip/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${frontendUrl}/vip/cancel`,
          client_reference_id: userId.toString(),
          metadata: {
            userId: userId.toString(),
            plan: plan,
            amount: amount.toString(),
          },
        });

        console.log(`[VIPController] Stripe session created for user: ${userId}, plan: ${plan}`);
        return sendSuccess(
          res,
          {
            sessionId: session.id,
            stripeSessionId: session.id,
            url: session.url,
            plan,
            amount,
            currency: 'USD',
            paymentMethod: 'stripe',
          },
          'Stripe checkout session created successfully'
        );
      } catch (stripeError) {
        console.error('[VIPController] Stripe error:', stripeError);
        return sendError(res, `Stripe error: ${stripeError.message}`, 500);
      }
    }

    // Fallback for testing or when Stripe is not configured
    // Also handle PayPal here (when PayPal SDK is added)
    const sessionId = `session_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[VIPController] Payment session created for user: ${userId}, plan: ${plan}`);
    return sendSuccess(
      res,
      {
        sessionId,
        plan,
        amount,
        currency: 'USD',
        paymentMethod,
        note: stripe ? 'Stripe is configured' : 'Stripe not configured - using test mode',
      },
      'Payment session created successfully'
    );
  } catch (error) {
    console.error('[VIPController] Error creating payment session:', error);
    return sendError(res, error.message || 'Failed to create payment session', 500);
  }
};

// Handle webhook from Stripe/PayPal
const handleWebhook = async (req, res) => {
  try {
    // Get raw body for signature verification (Stripe requires raw body)
    const signature = req.headers['stripe-signature'];
    const paymentProvider = req.headers['x-payment-provider'] || 
                           (signature ? 'stripe' : 'paypal');

    let event;
    let paymentData;

    if (paymentProvider === 'stripe' && stripe) {
      // Stripe webhook handling with signature verification
      try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
          console.warn('Stripe webhook secret not configured, skipping signature verification');
          // For development/testing, allow without verification
          event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } else if (signature) {
          // Verify webhook signature
          event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            webhookSecret
          );
        } else {
          return res.status(400).json({
            success: false,
            message: 'Missing Stripe signature',
          });
        }
      } catch (stripeError) {
        console.error('Stripe webhook signature verification failed:', stripeError.message);
        return res.status(400).json({
          success: false,
          message: `Webhook signature verification failed: ${stripeError.message}`,
        });
      }
      
      // Handle different Stripe event types
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        paymentData = {
          userId: session.metadata?.userId || session.client_reference_id,
          plan: session.metadata?.plan,
          paymentId: session.id,
          amount: session.amount_total ? session.amount_total / 100 : parseFloat(session.metadata?.amount || 0),
          status: 'succeeded',
          provider: 'stripe',
        };
      } else if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        paymentData = {
          userId: paymentIntent.metadata?.userId,
          plan: paymentIntent.metadata?.plan,
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: 'succeeded',
          provider: 'stripe',
        };
      } else {
        // Ignore other event types
        console.log(`Ignoring Stripe event type: ${event.type}`);
        return res.json({ received: true });
      }
    } else if (paymentProvider === 'paypal') {
      // PayPal webhook handling
      // In production, verify PayPal webhook signature
      event = req.body;
      
      // Handle PayPal webhook events
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || 
          event.event_type === 'CHECKOUT.ORDER.APPROVED') {
        const resource = event.resource || event.resource;
        paymentData = {
          userId: resource.custom_id || resource.purchase_units?.[0]?.custom_id,
          plan: resource.custom_id?.split('_')[1] || 'monthly', // Extract plan from custom_id
          paymentId: resource.id || event.resource.id,
          amount: parseFloat(resource.amount?.value || resource.amount?.total || 0),
          status: 'succeeded',
          provider: 'paypal',
        };
      } else {
        // Ignore other event types
        return res.json({ received: true });
      }
    } else {
      // For testing: accept direct payment data
      paymentData = {
        userId: req.body.userId,
        plan: req.body.plan,
        paymentId: req.body.paymentId || `payment_${Date.now()}`,
        amount: req.body.amount,
        status: 'succeeded',
        provider: req.body.provider || 'stripe',
      };
    }

    if (!paymentData || !paymentData.userId || !paymentData.plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook data',
      });
    }

    // Calculate expiry date
    const expiryDate = calculateVIPExpiry(paymentData.plan);
    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid VIP plan',
      });
    }

    // Find or create membership
    let membership = await Membership.findOne({ userId: paymentData.userId });
    
    if (membership) {
      // Update existing membership
      membership.vipStatus = true;
      membership.vipExpiry = expiryDate;
      membership.vipPlan = paymentData.plan;
      membership.paymentProvider = paymentData.provider;
      membership.paymentId = paymentData.paymentId;
      membership.lastPaymentDate = new Date();
      await membership.save();
    } else {
      // Create new membership
      membership = await Membership.create({
        userId: paymentData.userId,
        vipStatus: true,
        vipExpiry: expiryDate,
        vipPlan: paymentData.plan,
        paymentProvider: paymentData.provider,
        paymentId: paymentData.paymentId,
        lastPaymentDate: new Date(),
      });
    }

    // Sync with User model for backward compatibility
    await User.findByIdAndUpdate(
      paymentData.userId,
      {
        isVIP: true,
        vipExpiryDate: expiryDate,
        vipExpiresAt: expiryDate,
        vipExpiry: expiryDate,
        vipPlan: paymentData.plan,
      },
      { new: true }
    );

    console.log(`VIP membership activated for user ${paymentData.userId}, plan: ${paymentData.plan}`);

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        membershipId: membership._id,
        userId: paymentData.userId,
        vipStatus: true,
        vipExpiry: expiryDate,
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Webhook processing failed',
    });
  }
};

// Check and disable expired VIP memberships
const checkAndDisableExpiredVIP = async () => {
  try {
    const now = new Date();
    
    // Find expired memberships
    const expiredMemberships = await Membership.find({
      vipStatus: true,
      vipExpiry: { $lte: now },
    });

    if (expiredMemberships.length === 0) {
      return { success: true, expiredCount: 0 };
    }

    // Disable expired memberships
    const userIds = expiredMemberships.map(m => m.userId);
    
    await Membership.updateMany(
      {
        vipStatus: true,
        vipExpiry: { $lte: now },
      },
      {
        $set: {
          vipStatus: false,
          vipPlan: 'none',
        },
      }
    );

    // Sync with User model
    await User.updateMany(
      {
        _id: { $in: userIds },
      },
      {
        $set: {
          isVIP: false,
          vipPlan: 'none',
        },
      }
    );

    console.log(`Disabled ${expiredMemberships.length} expired VIP memberships`);

    return {
      success: true,
      expiredCount: expiredMemberships.length,
      userIds: userIds.map(id => id.toString()),
    };
  } catch (error) {
    console.error('Error checking expired VIP:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify VIP status endpoint
const verifyVIPStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check membership first
    let membership = await Membership.findOne({ userId });
    
    // If no membership exists, check User model for backward compatibility
    if (!membership) {
      const user = await User.findById(userId);
      if (user && user.isVIP && user.vipExpiryDate && new Date(user.vipExpiryDate) > new Date()) {
        // Create membership from User data
        membership = await Membership.create({
          userId,
          vipStatus: true,
          vipExpiry: user.vipExpiryDate,
          vipPlan: user.vipPlan || 'monthly',
        });
      } else {
        return res.json({
          success: true,
          data: {
            isVIP: false,
            isActive: false,
            vipExpiry: null,
            vipPlan: 'none',
            daysRemaining: 0,
          },
        });
      }
    }

    const isActive = membership.isActive();
    const daysRemaining = membership.getDaysRemaining();

    res.json({
      success: true,
      data: {
        isVIP: membership.vipStatus,
        isActive,
        vipExpiry: membership.vipExpiry,
        vipPlan: membership.vipPlan,
        daysRemaining,
        paymentProvider: membership.paymentProvider,
      },
    });
  } catch (error) {
    console.error('Error verifying VIP status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error verifying VIP status',
    });
  }
};

// Helper function
const getPlanPrice = (plan) => {
  const prices = {
    monthly: 9.99,
    '3months': 24.99,
    yearly: 79.99,
  };
  return prices[plan] || 0;
};

module.exports = {
  getVIPPlans,
  createPaymentIntent,
  createSession,
  activateVIP,
  getVIPStatus,
  handleWebhook,
  checkAndDisableExpiredVIP,
  verifyVIPStatus,
};

