"use client"

import { useEffect, useState } from "react"
import {
  Container,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Box,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { Navigation } from "@/components/navigation"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend)

interface StockData {
  price: number
  lastUpdatedAt: string
}

interface Stock {
  [key: string]: string
}

const API_BASE = "http://20.244.56.144/evaluation-service"

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock>({})
  const [selectedStock, setSelectedStock] = useState<string>("")
  const [timeInterval, setTimeInterval] = useState<number>(30)
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [average, setAverage] = useState<number>(0)

  // Fetch available stocks
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch(`${API_BASE}/stocks`)
        const data = await response.json()
        setStocks(data.stocks)
        // Set first stock as default
        const firstTicker = Object.values(data.stocks)[0] as string
        setSelectedStock(firstTicker)
      } catch (err) {
        setError("Failed to fetch stocks list")
      }
    }
    fetchStocks()
  }, [])

  // Fetch stock data when stock or interval changes
  useEffect(() => {
    if (!selectedStock) return

    const fetchStockData = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(`${API_BASE}/stocks/${selectedStock}?minutes=${timeInterval}`)
        const data = await response.json()

        if (data.stock) {
          // Handle single data point
          setStockData([data.stock])
          setAverage(data.stock.price)
        } else {
          // Handle array of data points
          const dataArray = Object.values(data) as StockData[]
          setStockData(dataArray)
          const avg = dataArray.reduce((sum, item) => sum + item.price, 0) / dataArray.length
          setAverage(avg)
        }
      } catch (err) {
        setError("Failed to fetch stock data")
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchStockData, 30000)
    return () => clearInterval(interval)
  }, [selectedStock, timeInterval])

  const chartData = {
    labels: stockData.map((_, index) => `Point ${index + 1}`),
    datasets: [
      {
        label: "Stock Price",
        data: stockData.map((item) => item.price),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
      {
        label: "Average",
        data: Array(stockData.length).fill(average),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderDash: [5, 5],
        pointRadius: 0,
      },
    ],
  }

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `${Object.keys(stocks).find((key) => stocks[key] === selectedStock) || selectedStock} Stock Price`,
      },
      tooltip: {
        callbacks: {
          afterBody: (context) => {
            const dataIndex = context[0].dataIndex
            const dataPoint = stockData[dataIndex]
            if (dataPoint) {
              return [
                `Time: ${new Date(dataPoint.lastUpdatedAt).toLocaleString()}`,
                `Price: $${dataPoint.price.toFixed(2)}`,
                `Average: $${average.toFixed(2)}`,
                `Deviation: ${(((dataPoint.price - average) / average) * 100).toFixed(2)}%`,
              ]
            }
            return []
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "Price ($)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time Points",
        },
      },
    },
  }

  const getStockName = (ticker: string) => {
    return Object.keys(stocks).find((key) => stocks[key] === ticker) || ticker
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Navigation />

      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Stock Price Analysis
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select Stock</InputLabel>
              <Select value={selectedStock} label="Select Stock" onChange={(e) => setSelectedStock(e.target.value)}>
                {Object.entries(stocks).map(([name, ticker]) => (
                  <MenuItem key={ticker} value={ticker}>
                    {name} ({ticker})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ minWidth: 200 }}>
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
              />
            </Box>
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
          ) : stockData.length > 0 ? (
            <>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      Current Price
                    </Typography>
                    <Typography variant="h4">${stockData[stockData.length - 1]?.price.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" color="secondary">
                      Average Price
                    </Typography>
                    <Typography variant="h4">${average.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6">Data Points</Typography>
                    <Typography variant="h4">{stockData.length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6">Price Range</Typography>
                    <Typography variant="h4">
                      ${Math.min(...stockData.map((d) => d.price)).toFixed(2)} - $
                      {Math.max(...stockData.map((d) => d.price)).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ height: 400 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </>
          ) : (
            <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
              No data available for the selected stock and time interval.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
