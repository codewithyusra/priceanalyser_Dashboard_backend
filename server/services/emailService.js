const sgMail = require('@sendgrid/mail');

const sendResetEmail = async (email, resetLink) => {
  // Initialize SendGrid with API Key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    // This must be the email address you verify in your SendGrid dashboard
    from: process.env.SENDGRID_FROM_EMAIL || 'alyusrasikander@gmail.com',
    subject: 'Password Reset Request - Analyze It',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ec4899;">Analyze It Intelligence</h2>
        <p>You requested a password reset for your account.</p>
        <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Analyze It © 2026. Premium Pricing Intelligence.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid');
    return true;
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

module.exports = { sendResetEmail };
