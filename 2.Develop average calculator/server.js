import express from "express"
import fetch from "node-fetch"
import { AbortController } from "node-fetch/externals"
import cors from "cors"
import helmet from "helmet"

const app = express()
const PORT = process.env.PORT || 9876
const WINDOW_SIZE = 10

// Enable CORS and security headers
app.use(cors())
app.use(helmet())

// Map of API endpoints for different number types
const API_ENDPOINTS = {
  p: "http://20.244.56.144/evaluation-service/primes",
  f: "http://20.244.56.144/evaluation-service/fibo",
  e: "http://20.244.56.144/evaluation-service/even",
  r: "http://20.244.56.144/evaluation-service/rand",
}

// In-memory storage for the window of numbers
let numberWindow = []

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// API documentation endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Average Calculator Microservice",
    endpoints: {
      "/numbers/:numberid":
        "Get numbers and calculate average. Valid numberid values: p (prime), f (fibonacci), e (even), r (random)",
      "/health": "Health check endpoint",
    },
  })
})

app.get("/numbers/:numberid", async (req, res) => {
  const startTime = Date.now()
  const { numberid } = req.params

  // Validate the number ID
  if (!["p", "f", "e", "r"].includes(numberid)) {
    console.warn(`Invalid number ID requested: ${numberid}`)
    return res.status(400).json({
      error: "Invalid number ID. Use p (prime), f (fibonacci), e (even), or r (random).",
    })
  }

  try {
    // Store the current state of the window before making the API call
    const windowPrevState = [...numberWindow]

    // Fetch numbers from the third-party server with a timeout
    console.log(`Fetching numbers from ${API_ENDPOINTS[numberid]}`)
    const numbers = await fetchNumbersWithTimeout(API_ENDPOINTS[numberid], 500)
    console.log(`Received ${numbers.length} numbers from the API`)

    // Update the window with unique numbers
    updateWindow(numbers)

    // Calculate the average
    const avg = calculateAverage(numberWindow)

    // Ensure we respond within 500ms
    const processingTime = Date.now() - startTime
    if (processingTime > 450) {
      console.warn(`Warning: Processing time (${processingTime}ms) is approaching the 500ms limit.`)
    }

    // Return the response
    return res.json({
      windowPrevState,
      windowCurrState: numberWindow,
      numbers,
      avg: Number.parseFloat(avg.toFixed(2)),
    })
  } catch (error) {
    console.error("Error processing request:", error.message)
    return res.status(500).json({
      error: "Failed to process the request",
      message: error.message,
    })
  }
})

// Function to fetch numbers with a timeout
async function fetchNumbersWithTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return data.numbers || []
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === "AbortError") {
      console.warn(`Request to ${url} timed out after ${timeoutMs}ms`)
      return []
    }
    throw error
  }
}

// Function to update the window with unique numbers
function updateWindow(newNumbers) {
  // Filter out duplicates
  const uniqueNewNumbers = newNumbers.filter((num) => !numberWindow.includes(num))

  if (uniqueNewNumbers.length === 0) {
    console.log("No new unique numbers to add to the window")
    return
  }

  console.log(`Adding ${uniqueNewNumbers.length} unique numbers to the window`)

  // If adding all unique numbers would exceed the window size
  if (numberWindow.length + uniqueNewNumbers.length > WINDOW_SIZE) {
    // Calculate how many old numbers to remove
    const removeCount = Math.min(uniqueNewNumbers.length, numberWindow.length + uniqueNewNumbers.length - WINDOW_SIZE)

    console.log(`Window size would be exceeded. Removing ${removeCount} oldest numbers`)

    // Remove the oldest numbers
    numberWindow = numberWindow.slice(removeCount)
  }

  // Add new unique numbers, but ensure we don't exceed the window size
  const numbersToAdd = uniqueNewNumbers.slice(0, WINDOW_SIZE - numberWindow.length)
  numberWindow = [...numberWindow, ...numbersToAdd]

  console.log(`Current window size: ${numberWindow.length}`)
}

// Function to calculate the average of numbers in the window
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0
  const sum = numbers.reduce((acc, num) => acc + num, 0)
  return sum / numbers.length
}

// Error handling for unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
  })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Average Calculator microservice running on http://localhost:${PORT}`)
  console.log(`Window size configured to: ${WINDOW_SIZE}`)
})

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  process.exit(0)
})
