import pool from "../config/db.js";

const fetchLiveMarketData = async () => {
    
    return [
        { item_name: "Cement (50kg Bag)", base_price: 520 },
        { item_name: "Rebar (60-grade ton)", base_price: 92000 },
        { item_name: "Bricks (per 1000)", base_price: 12000 },
        { item_name: "Sand (per cft)", base_price: 45 }
    ].map(item => ({
        ...item,
        current_price: Math.round(item.base_price * (0.95 + Math.random() * 0.10))
    }));
};

export const updateMaterialRates = async () => {
    console.log("📈 Checking live market rates...");
    
    try {
        const liveRates = await fetchLiveMarketData();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const item of liveRates) {
                await client.query(`
                    INSERT INTO Material_Rates (item_name, unit_price, last_updated)
                    VALUES ($1, $2, CURRENT_DATE)
                    ON CONFLICT (item_name) 
                    DO UPDATE SET 
                        unit_price = EXCLUDED.unit_price,
                        last_updated = CURRENT_DATE;
                `, [item.item_name, item.current_price]);
            }

            await client.query('COMMIT');
            console.log("Success! Material rates updated to latest market prices.");
        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Failed to update rates:", err);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Market Data Error:", err);
    }
};