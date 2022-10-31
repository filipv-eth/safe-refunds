const { writeFile } = require('fs').promises;
const readline = require('readline');

async function main() {
  const apiUrl = 'https://safe-transaction-mainnet.safe.global/api';

  let address = `${(await question('Safe address? '))}`;
  // const address = "0xAF28bcB48C40dBC86f52D459A6562F658fc94B1e"

  // Parse general safe information
  const metadata = await apifetch(`${apiUrl}/v1/safes/${address}/`);
  console.log(`\nVersion: ${metadata.version}`);
  console.log(`Nonce: ${metadata.nonce}`);
  console.log(`Threshold: ${metadata.threshold}`);
  console.log(`Owners:\n\n${metadata.owners.join(`\n`)}\n`);

  // Fetch transactions
  console.log("Fetching transactions . . .\n");
  let transactions = await apifetch(`${apiUrl}/v1/safes/${address}/multisig-transactions/`);
  console.log(`Transactions: ${transactions.count}`);
  console.log(`Unique Nonces: ${transactions.countUniqueNonce}\n`);

  // Push fields into output, then fetch next page
  let output = [];
  while(transactions.next !== null) {
    console.log(`Processing ${transactions.results.length} transactions . . .`);
    for(let { nonce, isExecuted, transactionHash, fee, executor, executionDate } of transactions.results) {
      fee /= 1000000000000000000;
      output.push({ nonce, isExecuted, transactionHash, fee, executor, executionDate });
    }
    transactions = await apifetch(`${transactions.next}`);
  }

  // Write to disc
  writecsv("./output.csv", array2csv(output));
  console.log("\nComplete ✅");
}

function apifetch (url) {
  return new Promise(resolve => {
    require('https').get(url, (resp)=>{
      let data = '';
  
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      // The whole response has been received. Resolve the result.
      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
      
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
  });
}

function question(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, });

  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}

function array2csv (data) {
  let csv = data.map(row => Object.values(row));
  csv.unshift(Object.keys(data[0]));
  return csv.join('\n');
}

async function writecsv (fileName, data) {
  try {
    await writeFile(fileName, data, 'utf8'); 
  } catch (e) {
    console.error(e);
  }
}

main().catch((e) => console.error(`Failed to run:`, e))
