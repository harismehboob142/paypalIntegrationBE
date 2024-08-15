const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Function to get access token from PayPal
async function getAccessToken() {
  const PAYPAL_API = functions.config().paypal.api_url;
  const CLIENT_ID = functions.config().paypal.client_id;
  const SECRET = functions.config().paypal.secret;

  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");
  const response = await axios.post(
    `${PAYPAL_API}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

// Firebase function to create a payout
exports.createPayout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const accessToken = await getAccessToken();
      const PAYPAL_API = functions.config().paypal.api_url;

      const response = await axios.post(
        `${PAYPAL_API}/v1/payments/payouts`,
        {
          sender_batch_header: {
            sender_batch_id: `batch-${Math.random().toString(36).substring(7)}`,
            email_subject: "You have a payout!",
            email_message:
              "You have received a payout! Thanks for using our service!",
          },
          items: [
            {
              recipient_type: "EMAIL",
              amount: {
                value: "70.00",
                currency: "USD",
              },
              receiver: "sb-kjm6s31893524@personal.example.com",
              note: "Thanks for your business!",
              sender_item_id: "item-1",
            },
            {
              recipient_type: "EMAIL",
              amount: {
                value: "30.00",
                currency: "USD",
              },
              receiver: "sb-kjm6s31893524@personal.example.com",
              note: "Thanks for your business!",
              sender_item_id: "item-2",
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.status(200).send(response.data);
    } catch (error) {
      console.error(
        "Error creating payout:",
        error.response ? error.response.data : error.message
      );
      res
        .status(500)
        .send(error.response ? error.response.data : error.message);
    }
  });
});

// Firebase function to refund a payment
exports.refundPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const accessToken = await getAccessToken();
      const PAYPAL_API = functions.config().paypal.api_url;
      const { captureId, amount } = req.body;

      const response = await axios.post(
        `${PAYPAL_API}/v2/payments/captures/${captureId}/refund`,
        {
          amount: {
            value: amount,
            currency_code: "USD",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.status(200).send(response.data);
    } catch (error) {
      console.error(
        "Error refunding payment:",
        error.response ? error.response.data : error.message
      );
      res
        .status(500)
        .send(error.response ? error.response.data : error.message);
    }
  });
});
