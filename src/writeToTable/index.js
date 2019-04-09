const AWS = require('aws-sdk');
const Flickr = require('flickr-sdk');

async function getPhotos () {
  const flickr = new Flickr(process.env.FLICKR_API_KEY);
  // Get photos from the Flickr api
  try {
    // All options: https://www.flickr.com/services/api/flickr.photos.search.html
    const photos = await flickr.photos.search({
      text: 'servers datacenter', // the search text
      sort: 'interestingness-desc', // sort to attempt to reduce spam photos
      content_type: 1, // only photos
      safe_search: 1, // only SFW photos please
      extras: 'url_o', // we want the original image urls
      per_page: 100
    });
    return photos.body.photos.photo;
  }
  catch (error) {
    console.log('Error getting photos');
    console.log(error);
  }
}

exports.handler = async () => {
  // Fetch an array of photo objects
  const photoArray = await getPhotos();
  // Write new items to the ServerTable
  // Duplicate entries will be skipped
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  // We'll be using promises to make sure everything gets written when the Lambda is called
  let promiseArray = [];

  for (let photo of photoArray) {
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        id: photo.id,
        title: photo.title || null,
        url: photo.url_o,
        height: photo.height_o,
        width: photo.width_o
      },
      ConditionExpression: 'attribute_not_exists(id)', // do not overwrite existing entries
      ReturnConsumedCapacity: 'TOTAL'
    };

    const p = dynamodb.put(params)
      .promise()
      .then(() => {
        console.log(`Writing ${photo.id} to table ${process.env.TABLE_NAME}. Sweet!`);
      })
      .catch((error) => {
        console.log(`Error writing ${photo.id} to table ${process.env.TABLE_NAME}. The entry may already exist.`);
        console.log(error.message);
      });
    promiseArray.push(p);
  };

  try {
    await Promise.all(promiseArray);
    console.log('Writing to dynamodb');
  } catch (error) {;
    console.log(error);
  }

  // Return a 200 response if no errors
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: 'Success!'
  };

  return response;
};