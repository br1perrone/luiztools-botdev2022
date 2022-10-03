require("dotenv").config()

const WebSocket = require("ws")
const axios = require("axios")
const crypto = require("node:crypto")

const ws = new WebSocket(`${process.env.STREAM_URL}${process.env.SYMBOL}@bookTicker`)

let isOpened = false

ws.onmessage = async (event) => {
    const obj = JSON.parse(event.data)
    const price = parseFloat(obj.a)

    console.log("Symbol: ", obj.s, "  Price: ", price)

    if (price < 19550 && !isOpened) {
        console.log("Buy!")
        isOpened = true
        newOrder(process.env.SYMBOL.toUpperCase(), "0.001", "BUY")
    }
    else if (price > 19560 && isOpened) {
        console.log("Sell!")
        isOpened = false
        newOrder(process.env.SYMBOL.toUpperCase(), "0.001", "SELL")
    }
}

async function newOrder(symbol, quantity, side) {
    const data = { symbol, quantity, side}
    data.type = "MARKET"
    data.timestamp = Date.now()
    
    const signature = crypto
        .createHmac("sha256", process.env.SECRET_KEY)
        .update(new URLSearchParams(data).toString())
        .digest("hex")
    
    data.signature = signature

    const result = await axios({
        method: "POST",
        url: process.env.API_URL + '/v3/order?' + new URLSearchParams(data),
        headers: { "X-MBX-APIKEY": process.env.API_KEY, },
    })

    console.log(result.data)
}