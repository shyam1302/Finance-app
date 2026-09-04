// Live price fetch route
router.get('/investments/live-price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1d&range=1d`
        );
        const data = await response.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        res.json({ success: true, price, symbol });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});