const AWS = require('aws-sdk');

exports.handler = async () => {
  // Get server photos from ServerTable
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: process.env.TABLE_NAME
  };
  let photos, body, header;
  let allPhotos = [];

  try {
    photos = await dynamodb.scan(params).promise();
    photos.Items.forEach((photo) => allPhotos.push(photo));
    console.log(`Getting data from table ${process.env.TABLE_NAME}. Right on!`);
  } catch (error) {
    console.log(`Error getting data from table ${process.env.TABLE_NAME}. Make sure this function is running in the same environment as the table.`);
    throw new Error(error); // stop execution if data from dynamodb not available
  }
  
  try {
    // Select a random photo of the day
    const dailyPhoto = await getRandomPhoto(allPhotos);
    // Create the email
    const today = new Date();
    body = await generateEmailBody(dailyPhoto, today);
    header = `Daily Server Email`;
    // Send the email
    console.log(`Sending email to ${process.env.SEND_EMAIL}.`);
    await sendEmail(header, body);
    console.log(`Email sent`);
  } catch (error) {
    console.log(`Error sending email`);
    console.log(error);
  }

  // Return a 200 response if no errors
  const response = {
    statusCode: 200,
    body: `Email sent. Body:\n${body}`
  };

  return response;
};

// Select a random photo
function getRandomPhoto (photos) {
  return photos[Math.floor(Math.random()*photos.length)];
};

// Make a pretty email body
function generateEmailBody (photo, today) {
  console.log('Generating pretty email');
  const header = `<h1>✨ An Important Reminder ✨</h1>`;
  const subHeader = `<h2>${getPrettyDate(today)}</h2>`;
  const photoSection = `
    <div class='main'>
      <h3>Yes, there are still servers in serverless. Here is one:</h3>
      <img src='${photo.url}' alt='${photo.title}'>
    </div>
  `;

  const style = `
    <style>
      body {font-family: sans-serif;}
      .main {
        align: center;
      }
    </style>
    `;

  return `
    <html>
      <head>${style}</head>
      <body>
        ${header}
        ${subHeader}
        <br/><hr/><br/>
        <div>
          ${photoSection}
        </div>
      </body>
    </html>
  `;
};

async function sendEmail (subject, body) {
  let params = {
    Destination: {
      ToAddresses: [
        process.env.SEND_EMAIL
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: 'anna.spysz@stackery.io'
  };

  const ses = new AWS.SES();
  await ses.sendEmail(params).promise();
}

function getPrettyDate (date) {
  const options = {  
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  };

return date.toLocaleString('en-us', options);
}