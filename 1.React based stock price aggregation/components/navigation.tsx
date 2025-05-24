"use client"

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material"
import { useRouter, usePathname } from "next/navigation"
import { TrendingUp, GridOn } from "@mui/icons-material"

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Stock Analytics Dashboard
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<TrendingUp />}
            onClick={() => router.push("/")}
            variant={pathname === "/" ? "outlined" : "text"}
            sx={{
              bgcolor: pathname === "/" ? "rgba(255,255,255,0.1)" : "transparent",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            Stock Analysis
          </Button>
          <Button
            color="inherit"
            startIcon={<GridOn />}
            onClick={() => router.push("/correlation")}
            variant={pathname === "/correlation" ? "outlined" : "text"}
            sx={{
              bgcolor: pathname === "/correlation" ? "rgba(255,255,255,0.1)" : "transparent",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            Correlation Heatmap
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
