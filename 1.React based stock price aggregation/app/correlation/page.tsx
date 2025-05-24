"use client"

import { useEffect, useState } from "react"
import {
  Container,
  Typography,
  Card,
  CardContent,
  Slider,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Tooltip,
} from "@mui/material"
import { Navigation } from "@/components/navigation"

interface StockData {
  price: number
  lastUpdatedAt: string
}

interface Stock {
  [key: string]: string
}

interface CorrelationData {
  [ticker: string]: StockData[]
}

interface StockStats {
  average: number
  standardDeviation: number
}

const API_BASE = "http://20.244.56.144/evaluation-service"

export default function CorrelationPage() {
  const [stocks, setStocks] = useState<Stock>({})
  const [timeInterval, setTimeInterval] = useState<number>(30)
  const [correlationData, setCorrelationData] = useState<CorrelationData>({})
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([])
  const [stockStats, setStockStats] = useState<{ [ticker: string]: StockStats }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [hoveredStock, setHoveredStock] = useState<string>("")

  // Fetch available stocks
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch(`${API_BASE}/stocks`)
        const data = await response.json()
        setStocks(data.stocks)
      } catch (err) {
        setError("Failed to fetch stocks list")
      }
    }
    fetchStocks()
  }, [])

  // Calculate correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length)
    if (n < 2) return 0

    const xSlice = x.slice(0, n)
    const ySlice = y.slice(0, n)

    const xMean = xSlice.reduce((sum, val) => sum + val, 0) / n
    const yMean = ySlice.reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let xSumSquares = 0
    let ySumSquares = 0

    for (let i = 0; i < n; i++) {
      const xDiff = xSlice[i] - xMean
      const yDiff = ySlice[i] - yMean
      numerator += xDiff * yDiff
      xSumSquares += xDiff * xDiff
      ySumSquares += yDiff * yDiff
    }

    const denominator = Math.sqrt(xSumSquares * ySumSquares)
    return denominator === 0 ? 0 : numerator / denominator
  }

  // Calculate standard deviation
  const calculateStandardDeviation = (values: number[]): number => {
    if (values.length < 2) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
    return Math.sqrt(variance)
  }

  // Fetch correlation data
  useEffect(() => {
    if (Object.keys(stocks).length === 0) return

    const fetchCorrelationData = async () => {
      setLoading(true)
      setError("")

      try {
        const tickers = Object.values(stocks)
        const promises = tickers.map(async (ticker) => {
          try {
            const response = await fetch(`${API_BASE}/stocks/${ticker}?minutes=${timeInterval}`)
            const data = await response.json()

            if (data.stock) {
              return { ticker, data: [data.stock] }
            } else {
              const dataArray = Object.values(data) as StockData[]
              return { ticker, data: dataArray }
            }
          } catch (err) {
            console.warn(`Failed to fetch data for ${ticker}`)
            return { ticker, data: [] }
          }
        })

        const results = await Promise.all(promises)
        const newCorrelationData: CorrelationData = {}
        const newStockStats: { [ticker: string]: StockStats } = {}

        results.forEach(({ ticker, data }) => {
          if (data.length > 0) {
            newCorrelationData[ticker] = data
            const prices = data.map((d) => d.price)
            const average = prices.reduce((sum, price) => sum + price, 0) / prices.length
            const standardDeviation = calculateStandardDeviation(prices)
            newStockStats[ticker] = { average, standardDeviation }
          }
        })

        setCorrelationData(newCorrelationData)
        setStockStats(newStockStats)

        // Calculate correlation matrix
        const tickersWithData = Object.keys(newCorrelationData)
        const matrix: number[][] = []

        for (let i = 0; i < tickersWithData.length; i++) {
          matrix[i] = []
          for (let j = 0; j < tickersWithData.length; j++) {
            if (i === j) {
              matrix[i][j] = 1
            } else {
              const xPrices = newCorrelationData[tickersWithData[i]].map((d) => d.price)
              const yPrices = newCorrelationData[tickersWithData[j]].map((d) => d.price)
              matrix[i][j] = calculateCorrelation(xPrices, yPrices)
            }
          }
        }

        setCorrelationMatrix(matrix)
      } catch (err) {
        setError("Failed to fetch correlation data")
      } finally {
        setLoading(false)
      }
    }

    fetchCorrelationData()
    // Refresh data every 60 seconds
    const interval = setInterval(fetchCorrelationData, 60000)
    return () => clearInterval(interval)
  }, [stocks, timeInterval])

  const getCorrelationColor = (correlation: number): string => {
    const intensity = Math.abs(correlation)
    if (correlation > 0) {
      // Positive correlation - shades of blue
      return `rgba(33, 150, 243, ${intensity})`
    } else {
      // Negative correlation - shades of red
      return `rgba(244, 67, 54, ${intensity})`
    }
  }

  const getStockName = (ticker: string) => {
    return Object.keys(stocks).find((key) => stocks[key] === ticker) || ticker
  }

  const tickersWithData = Object.keys(correlationData)

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Navigation />

      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Stock Correlation Heatmap
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Time Interval: {timeInterval} minutes</Typography>
            <Slider
              value={timeInterval}
              onChange={(_, value) => setTimeInterval(value as number)}
              min={5}
              max={120}
              step={5}
              marks={[
                { value: 5, label: "5m" },
                { value: 30, label: "30m" },
                { value: 60, label: "1h" },
                { value: 120, label: "2h" },
              ]}
              valueLabelDisplay="auto"
              sx={{ maxWidth: 400 }}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : tickersWithData.length > 0 ? (
            <>
              {/* Color Legend */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Correlation Legend
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: "rgba(244, 67, 54, 1)" }} />
                    <Typography variant="body2">Strong Negative (-1.0)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: "rgba(244, 67, 54, 0.5)" }} />
                    <Typography variant="body2">Weak Negative (-0.5)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: "rgba(128, 128, 128, 0.3)" }} />
                    <Typography variant="body2">No Correlation (0.0)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: "rgba(33, 150, 243, 0.5)" }} />
                    <Typography variant="body2">Weak Positive (+0.5)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, bgcolor: "rgba(33, 150, 243, 1)" }} />
                    <Typography variant="body2">Strong Positive (+1.0)</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Stock Stats Display */}
              {hoveredStock && stockStats[hoveredStock] && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: "primary.light", color: "primary.contrastText" }}>
                  <Typography variant="h6">
                    {getStockName(hoveredStock)} ({hoveredStock})
                  </Typography>
                  <Typography>Average Price: ${stockStats[hoveredStock].average.toFixed(2)}</Typography>
                  <Typography>Standard Deviation: ${stockStats[hoveredStock].standardDeviation.toFixed(2)}</Typography>
                  <Typography>Data Points: {correlationData[hoveredStock]?.length || 0}</Typography>
                </Paper>
              )}

              {/* Correlation Heatmap */}
              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 600 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: `120px repeat(${tickersWithData.length}, 80px)`,
                      gap: 1,
                    }}
                  >
                    {/* Empty top-left cell */}
                    <Box />

                    {/* Column headers */}
                    {tickersWithData.map((ticker) => (
                      <Tooltip key={ticker} title={getStockName(ticker)}>
                        <Box
                          sx={{
                            p: 1,
                            textAlign: "center",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            cursor: "pointer",
                            bgcolor: hoveredStock === ticker ? "primary.light" : "grey.100",
                            "&:hover": { bgcolor: "primary.light" },
                          }}
                          onMouseEnter={() => setHoveredStock(ticker)}
                          onMouseLeave={() => setHoveredStock("")}
                        >
                          {ticker}
                        </Box>
                      </Tooltip>
                    ))}

                    {/* Rows */}
                    {tickersWithData.map((rowTicker, i) => (
                      <Box key={rowTicker} sx={{ display: "contents" }}>
                        {/* Row header */}
                        <Tooltip title={getStockName(rowTicker)}>
                          <Box
                            sx={{
                              p: 1,
                              textAlign: "right",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              cursor: "pointer",
                              bgcolor: hoveredStock === rowTicker ? "primary.light" : "grey.100",
                              "&:hover": { bgcolor: "primary.light" },
                            }}
                            onMouseEnter={() => setHoveredStock(rowTicker)}
                            onMouseLeave={() => setHoveredStock("")}
                          >
                            {rowTicker}
                          </Box>
                        </Tooltip>

                        {/* Correlation cells */}
                        {tickersWithData.map((colTicker, j) => {
                          const correlation = correlationMatrix[i]?.[j] || 0
                          return (
                            <Tooltip key={colTicker} title={`${rowTicker} vs ${colTicker}: ${correlation.toFixed(3)}`}>
                              <Box
                                sx={{
                                  p: 1,
                                  textAlign: "center",
                                  fontSize: "0.7rem",
                                  bgcolor: getCorrelationColor(correlation),
                                  border: "1px solid rgba(0,0,0,0.1)",
                                  cursor: "pointer",
                                  "&:hover": {
                                    border: "2px solid black",
                                    fontWeight: "bold",
                                  },
                                }}
                              >
                                {correlation.toFixed(2)}
                              </Box>
                            </Tooltip>
                          )
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </>
          ) : (
            <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
              No correlation data available for the selected time interval.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
