const axios = require("axios");
require("dotenv").config();

const PAYPAL_API = process.env.PAYPAL_API_URL;
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Function to get access token from PayPal
async function getAccessToken() {
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

// Function to create a payout
async function createPayout(accessToken) {
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

  return response.data;
}

// Function to refund a payment
async function refundPayment(accessToken, captureId, amount) {
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

  return response.data;
}

// Main function to execute payout
async function main() {
  try {
    const captureId = "0W835952XM8342031";
    const refundAmount = "100.00"; // Replace with the amount you want to refund
    const accessToken = await getAccessToken();
    const refundResponse = await refundPayment(
      accessToken,
      captureId,
      refundAmount
    );
    console.log("refund response is here", refundResponse);
    // const payoutResponse = await createPayout(accessToken);
    // console.log("Payout Response:", payoutResponse);
  } catch (error) {
    console.error(
      "Error creating payout:",
      error.response ? error.response.data : error.message
    );
  }
}

main();
