const VERIFICATION_CODE_REGEX = /(?:code is:?\s*)(\d{6})/i;
const verificationEmailStrategy = ({ text }) => {
  const match = text.match(VERIFICATION_CODE_REGEX);
  if (!match) return null; 

  const verificationCode = match[1];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: normal;">SkillXChange</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px; font-weight: normal;">Email Verification</h2>
              <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 15px; line-height: 1.5;">
                Enter this code to verify your email address
              </p>
              <div style="background-color: #eff6ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; margin: 0 auto; display: inline-block;">
                <p style="margin: 0; color: #2563eb; font-size: 32px; font-weight: bold; letter-spacing: 6px;">${verificationCode}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} SkillXChange • Team SkillXChange
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

const genericEmailStrategy = ({ text }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: normal;">SkillXChange</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <div style="color: #374151; font-size: 15px; line-height: 1.6;">
                ${text.replace(/\n/g, "<br>")}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} SkillXChange • Team SkillXChange
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

const rawHtmlStrategy = ({ html }) => html;

const getHtmlForEmail = ({ text, html }) => {
  if (html) {
    return rawHtmlStrategy({ html });
  }
  const verificationHtml = verificationEmailStrategy({ text });
  if (verificationHtml) return verificationHtml;
  return genericEmailStrategy({ text });
};

module.exports = {
  getHtmlForEmail,
};
