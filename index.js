const requests = require('axios');
const DISCORD_WEBHOOK_URL = 'https://ptb.discord.com/api/v9/webhooks/x/xx';
const LTC_ADDRESS = 'LeUUjdR44S9314Y3LQUW1JeS4HCsDt6mK1';

let ltcpriceusd = 0;

async function fetchLtcPrice() {
  try {
    const response = await requests.get('https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD');
    const litecoin_price_usd = response.data.USD;
    ltcpriceusd = parseFloat(litecoin_price_usd);
  } catch (error) {
    console.error('Error fetching LTC price:', error.message);
  }
}

async function send(embedData) {
  try {
    await requests.post(DISCORD_WEBHOOK_URL, { content: "@everyone", embeds: [embedData] });
  } catch (error) {
    console.error('Error: ', error.message);
  }
}

async function ltcNotifier() {
  const endpoint = `https://api.blockcypher.com/v1/ltc/main/addrs/${LTC_ADDRESS}/full`;
  let initial_tx_count = 0;

  try {
    const response = await requests.get(endpoint);
    initial_tx_count = response.data.n_tx;
    console.log('Connected with address:', LTC_ADDRESS);
    console.log(`Initial transaction count: ${initial_tx_count}`);
  } catch (error) {
    console.error('Error:', error.message);
    return;
  }

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      const response = await requests.get(endpoint);
      // console.log(response.status);
      if (response.status === 429) {
        // console.log(response.data);
        process.exit(1);
      }

      const current_tx_count = response.data.n_tx;
      console.log(current_tx_count);

      if (current_tx_count > initial_tx_count) {
        const tx_data = response.data.txs[0];
        const tx_hash = tx_data.hash;
        const outputs = tx_data.outputs;
        let ltc_amount = 0;
        let usd_amount = 0;

        for (const output of outputs) {
          if (output.addresses[0] === LTC_ADDRESS) {
            ltc_amount = output.value / 100000000.0;
            console.log(ltc_amount);
            console.log(output.value);
            usd_amount = ltc_amount * ltcpriceusd;
          }
        }

        const usd_amount_str = `$${usd_amount.toFixed(2)}`;
        const embedData = {
          title: 'LTC TRANSACTION',
          color: 0x000000,
          description: `**Hash:** [${tx_hash}](https://blockchair.com/litecoin/transaction/${tx_hash})\n**Amount:** \`${ltc_amount.toFixed(8)} LTC\`\n**Now:** \`${usd_amount_str}\``,
          footer: { text: 'exploit xd' },
        };

        send(embedData);

        initial_tx_count = current_tx_count;
        continue;
      }
    } catch (error) {
      console.error('Error: ', error.message);
    }
  }
}


(async () => {
  await fetchLtcPrice();
  ltcNotifier(); 
})();
