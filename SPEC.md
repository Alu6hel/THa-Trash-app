# Technical Specification: THa Trash App

**High-Performance Waste Fleet Optimization & Disposables Logistics Engine**  
*Integrated with Alu Language Z3 Memory-Safe Native Core*

---

## 1. System Architecture

THa Trash App is architected as a hybrid edge application combining a reactive, offline-first client frontend with a high-performance native math/optimization core written in the **Alu Systems Programming Language**.

```
+-------------------------------------------------------------------------------+
|                             THa Trash App Frontend                           |
|                      React 18 + TypeScript + Tailwind CSS                    |
|                                                                               |
|  [Command Dashboard]  [Bin Fleet]  [Disposables]  [Route Planner]  [Metrics] |
+-------------------------------------------------------------------------------+
                                      |
                       Storage & Synchronization Layer
                    (IndexedDB via idb-keyval / LocalStorage)
                                      |
                      +---------------+---------------+
                      |                               |
                      v                               v
         [Browser Alu Math Mirror]       [Alu Native Core Engine]
           (Zero-dependency Web)         (bin_optimizer.alu binary)
                                                     |
                                            Z3 Theorem Prover
                                        Compile-Time Bounds Proof
```

---

## 2. Waste Stream Classification

| Stream | Alu Code | Hazard Weight | EPA WARM Factor | Primary Target Items |
| :--- | :---: | :---: | :---: | :--- |
| **General** | `1` | 50 | 0.0 kg CO₂e / kg | Non-recyclable wrappers, soiled film, mixed trash |
| **Recyclables** | `2` | 80 | 2.8 kg CO₂e / kg | Clean rigid plastics (PET/HDPE), paper, metals |
| **Compost** | `3` | 120 | 0.5 kg CO₂e / kg | Food scraps, BPI-certified PLA, napkins |
| **Hazardous** | `4` | 250 | Special Disposal | Lab biohazards, medical sharps, chemicals |
| **E-Waste** | `5` | 90 | 3.5 kg CO₂e / kg | Lithium batteries, printed circuit boards, cables |

---

## 3. Mathematical Optimization & Z3 Proofs (Alu Engine)

### 3.1. Predictive Overflow Modeling
Calculates time-to-fill using live ultrasonic sensor telemetry:
```
hours_until_overflow = floor((100 - current_fill_pct) / fill_rate_per_hour)
```
**Z3 Invariant Contract:**
`@requires(fill_rate_per_hour > 0)` guarantees mathematically zero division-by-zero risk at compile time.

### 3.2. Multi-Variable Collection Priority Scoring
Each receptacle is dynamically ranked on an integer scale `[0, 1000]`:
```
Priority = (FillPct * 6) + StreamWeight + TimeDecayBonus + RapidFillBonus
```
Where:
- `StreamWeight`: Hazardous (+250), Compost (+120), E-Waste (+90), Recycling (+80), General (+50).
- `TimeDecayBonus`: `min(150, hours_since_empty * 2)`.
- `RapidFillBonus`: `fill_rate > 5 ? (fill_rate * 4) : 0`.

### 3.3. Landfill Diversion Rate
Measures environmental compliance against municipal / enterprise Zero-Waste standards:
```
DiversionRate(%) = floor((Recycled_kg + Compost_kg + EWaste_kg) * 100 / Total_kg)
```
**Z3 Invariant Contract:**
`@requires(total_kg > 0)`

### 3.4. Greenhouse Gas Avoidance (CO₂e)
```
Avoided_CO2e_kg = floor((Recycled_kg * 2.8) + (Compost_kg * 0.5))
```

---

## 4. Disposables Inventory Depletion

Monitors single-use products (cups, cutlery, napkins, liners) before they enter the waste stream:
```
Days_Remaining = floor(Stock_Units / Daily_Burn_Rate)
```
**Alert States:**
- `Stock <= Restock_Threshold`: Triggers Reorder notification.
- `Days_Remaining <= 3`: Triggers Critical Supply Exhaustion alert.

---

## 5. Alu Native Engine CLI Reference

The native compiled executable is located at `alu_engine/bin/tha_trash_engine`:

```bash
# Run self-tests and sample simulation
./alu_engine/bin/tha_trash_engine

# Recompile with Alu compiler
cd alu_engine && bash build_alu.sh
```
