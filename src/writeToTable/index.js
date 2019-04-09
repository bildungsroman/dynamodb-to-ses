const AWS = require('aws-sdk');
const Flickr = require('flickr-sdk');

async function getPhotos () {
  const flickr = new Flickr(process.env.FLICKR_API_KEY);
  // get items from the flickr api
  try {
    const photos = await flickr.photos.search({
      text: 'servers datacenter',
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
  const photoArray = await getPhotos();
  console.log(photoArray);
  // write new items to the ServerTable
  // duplicate entries will be skipped
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  // we'll be using promises to make sure everything gets written when the lambda is called
  let promiseArray = [];

  // for (let item of changelogEntries) {
  //   const itemId = `${_.camelCase(item.Title)}-${item.Repository}`;
  //   const params = {
  //     TableName: process.env.TABLE_NAME,
  //     Item: {
  //       id: itemId,
  //       date: item.date,
  //       Repository: item.Repository,
  //       Title: item.Title,
  //       Author: item.Author,
  //       Feature: item.Feature || null,
  //       Resource: item.Resource || null,
  //       Release: item.Release || null,
  //       Fix: item.Fix || null,
  //       Deprecation: item.Deprecation || null,
  //       Refactor: item.Refactor || null,
  //       References: item.References || null,
  //     },
  //     ConditionExpression: 'attribute_not_exists(id)', // do not overwrite existing entries
  //     ReturnConsumedCapacity: 'TOTAL'
  //   };

  //   const p = dynamodb.put(params)
  //     .promise()
  //     .then(() => {
  //       console.log(`Writing ${itemId} to table ${process.env.TABLE_NAME}. Sweet!`);
  //     })
  //     .catch((error) => {
  //       console.log(`Error writing ${itemId} to table ${process.env.TABLE_NAME}. The entry may already exist.`);
  //       console.log(error.message);
  //     });
  //   promiseArray.push(p);
  // };

  // try {
  //   await Promise.all(promiseArray);
  //   console.log('Writing to dynamodb');
  // } catch (error) {;
  //   console.log(error);
  // }

  // return a 200 response if no errors
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(photoArray)
  };

  return response;
};