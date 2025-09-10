import cron from "node-cron";
import Message from "../models/Messages.js";
import User from "../models/User.js";
import sendEmail from "../config/nodeMailer.js";

// ✅ Schedule job: Roz subah 9 baje chalega (New York Time ke jagah abhi simple local time rakha hai)
// cron.schedule("0 9 * * *", () => {
//   console.log("⏰ Production Mode: Roz subah 9 baje ye task chal raha hai!");
// });


//het 2 minute me chalega 
cron.schedule("*/2 * * * *", async () => {
  try {
    const messages = await Message.find({ seen: false }).populate("to_user_id");
    const unseenCount = {};

    // Count unseen messages per user
    messages.map((message) => {
      unseenCount[message.to_user_id._id] =
        (unseenCount[message.to_user_id._id] || 0) + 1;
    });

    // Send email for each user
    for (const userId in unseenCount) {
      const user = await User.findById(userId);

      if (!user) continue;

      const subject = `You have ${unseenCount[userId]} unseen messages`;

      const body = `
        <div style="font-family: Arial,sans-serif; padding: 20px;">
          <h2>Hi ${user.full_name},</h2>
          <p>You have ${unseenCount[userId]} unseen messages</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color:#10b981;">here</a> to view them</p>
          <br/>
          <p>Thanks,<br/>PingUp - Stay Connected</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }

    // Unseen message notifications sent successfully
  } catch (error) {
    // Error sending notifications
  }
});
