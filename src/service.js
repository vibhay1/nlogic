
import scheduler from 'node-cron';
import fs from 'fs';
import csv from 'csv-parser';
import { nanoid as V4 } from 'nanoid';
import path from 'path';
import OpenAI from 'openai';
import product from './product.js';
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY
});


const fileName = '/product.csv'
async function processCSV(filePath) {
    let rowCounter = 0;
    let recordsToBeUpdate = [];
    let recordsToBeInsert = [];
    let miscellaneousData = [];
    let groupByProduct = {};
    try {


        const pipline = fs.createReadStream(filePath)
            .pipe(csv());
        pipline.on('data', async (row) => {
            rowCounter++;
            if (groupByProduct[row.ProductID]) {
                if (groupByProduct[row.ProductID].data.variants.findIndex(item => item.itemID == row.ItemID) === -1) {
                    groupByProduct[row.ProductID].data.variants.push({
                        itemID: row.ItemID || V4(),
                        itemDescription: row.ItemDescription,
                        packaging: row.PKG,
                    })
                }
                groupByProduct[row.ProductID].data.options.push({ id: V4(6) })
            } else {
                groupByProduct[row.ProductID] = {
                    docId: V4(),
                    data: {
                        name: row.ProductName,
                        description: row.ProductDescription,
                        productId: row.ProductID,
                        manufacturerName: row.ManufacturerName,
                        variants: [{
                            itemID: row.ItemID || V4(),
                            itemDescription: row.ItemDescription,
                            packaging: row.PKG,
                        }],
                        options: [{
                            id: V4(6)
                        }]
                    }
                }
            }

            if (rowCounter === 25000) {
                pipline.pause();
                recordsToBeInsert = Object.values(groupByProduct);
                recordsToBeInsert.forEach((ele, index) => {
                    if (!ele.data.productId) {
                        miscellaneousData.push(recordsToBeInsert.splice(index, 1));
                    }


                })
                try {
                    await product.insertMany(recordsToBeInsert, { ordered: false })
                } catch (e) {
                    e?.writeErrors?.forEach(item => {
                        const { productId, variants, options } = item?.err?.op.data;
                        if (productId && variants.length > 0) {
                            recordsToBeUpdate.push({
                                updateOne: {
                                    filter: {
                                        'data.productId': productId
                                    },
                                    update: {
                                        $addToSet: {
                                            'data.variants': { $each: variants }
                                        },
                                    },
                                    upsert: true
                                }
                            })
                        }
                    });
                    try {
                        await product.bulkWrite(recordsToBeUpdate)
                    } catch (err) {
                        err.writeErrors.forEach(e => {
                            console.log(e.err.op)
                        })
                    }

                }
                groupByProduct = {};
                rowCounter = 0;
                pipline.resume();
            }
        })
            .on('end', async () => {
                console.log('CSV file successfully processed');
                console.log(`These are miscellaneous/incompleted data we founded: ${miscellaneousData}`);
                descriptionEnhancement();
            }).on('error', (error) => {
                console.log("Error during read file")
            });
    } catch (error) {
        console.log("Exception: ", error)
    }
}


async function callOpenAIforEnhancement(desc) {
    try {
        // const response = await openai.completions.create({
        //     model: "gpt-3.5-turbo-instruct",
        //     prompt: `Enhance the following product description: ${desc}`,
        //     temperature: 0.7,
        //     max_tokens: 64,
        // }, {
        //     headers: 'application/json'
        // });
        // return response;
        return new Promise.resolve(desc);
    } catch (error) {
        return desc;
    }

}

async function descriptionEnhancement() {
    let toBeUpdate = [];
    try {
        const productsToEnhance = await product.find().limit(10);
        for await (const record of productsToEnhance) {
            const response = await callOpenAIforEnhancement(record.data.description);
            toBeUpdate.push({
                updateOne: {
                    filter: {
                        '_id': record._id
                    },
                    update: {
                        $set: {
                            'data.description': response
                        }
                    }
                }
            })
            // console.log("responseresponse====", response)// after this We can update description with update value
            // Unfortunetly, I do not have quota to make API open API call we just need to do some few steps     
        }
    } catch (error) {
        console.log("Error", error)
    } finally {
        try {
            await product.bulkWrite(toBeUpdate)
        } catch (er) {
            console.log("Exception: ", er)
        }

    }

}

function taskStart() {
    processCSV(path.join(path.resolve(), 'src/assets', fileName))
}

scheduler.schedule('0 1 * * *', () => {
    taskStart();
    console.log('Running a job at 01:00 at America/Sao_Paulo timezone');
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});
