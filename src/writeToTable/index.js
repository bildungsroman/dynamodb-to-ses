require('isomorphic-fetch');
const AWS = require('aws-sdk');
const Unsplash = require('unsplash-js').default;
const toJson = require('unsplash-js').toJson;
const unsplash = new Unsplash({
  applicationId: process.env.UNSPLASH_ACCESS_KEY,
  secret: process.env.UNSPLASH_SECRET_KEY
});

exports.handler = async () => {
  let result;
  // get items from the unsplash api
  try {
    const getPhotos = await unsplash.search.photos('servers');
    if (getPhotos) {
      result = toJson(getPhotos);
      console.log(result);
    }
  } catch (error) {
    console.log('Error getting photos');
  }

  
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
    body: JSON.stringify(result)
  };

  return response;
};