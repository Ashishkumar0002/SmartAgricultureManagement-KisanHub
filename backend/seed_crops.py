"""Seed crop information database with detailed farming knowledge"""

from app.db import get_db, engine, Base
from app.models import CropInfo

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

crops_data = [
    {
        "name": "Wheat",
        "crop_type": "Grain",
        "climate_requirements": "Cool season crop, optimal temperature 15-25°C. Can tolerate frost.",
        "soil_type": "Well-drained loamy or clay loam soil, pH 6.0-7.5",
        "sowing_season": "October-November (Winter)",
        "harvesting_time": "April-May",
        "production_steps": """
1. Land Preparation: Plough 4-5 times, break clods, create fine tilth
2. Seed Treatment: Treat seeds with fungicide (Thiram 3g/kg)
3. Sowing: Broadcast or line sowing at 100-125 kg/ha depth 3-5 cm
4. Spacing: Row to row 20-23 cm, plant to plant 10-12 cm
5. Fertilization: Apply 120 kg N, 60 kg P, 40 kg K per hectare
6. Irrigation: 4-5 irrigations - at CRI, Tillering, Flowering, Grain filling
7. Weeding: Manual or chemical weeding at 40-60 days
8. Harvesting: When crop turns golden brown, moisture 10-12%
9. Threshing: Mechanical threshing, clean and store
        """,
        "best_practices": """
- Use improved varieties like PBW 343, DBW 17, HD 2932
- Rotate crops to prevent soil depletion
- Use certified seeds from authorized agencies
- Adopt conservation agriculture techniques
- Follow IPM for pest and disease management
- Ensure timely field preparation and sowing
- Apply recommended doses of fertilizers
- Maintain proper plant population
        """,
        "water_requirements": "500-750 mm annually. Requires 4-5 irrigations depending on rainfall.",
        "fertilizer_recommendations": "Nitrogen 120 kg/ha, Phosphorus 60 kg/ha, Potassium 40 kg/ha. Apply as per soil test recommendations.",
        "pest_disease_prevention": """
Pests: Armyworm, Sawfly, Termites - Use Triazophos/Malathion
Diseases: Loose smut, Karnal bunt - Use Carbendazim, improve drainage
Birds: Use bird nets, scare guns, or reflectors
        """,
        "expected_yield": "40-50 quintals per hectare (improved varieties)",
        "market_tips": """
- Peak market price in May-June after harvest
- Store in cool, dry place to prevent pest infestation
- Sell through farmers' cooperatives for better prices
- Check quality standards (moisture, foreign matter) before selling
- Target wholesale markets during monsoon for premium prices
        """,
    },
    {
        "name": "Rice",
        "crop_type": "Grain",
        "climate_requirements": "Warm season crop, 20-30°C optimal. Requires high rainfall or irrigation.",
        "soil_type": "Clayey loam, well-puddled soil, pH 5.5-7.0. Requires standing water.",
        "sowing_season": "June-July (Monsoon)",
        "harvesting_time": "September-October",
        "production_steps": """
1. Nursery Preparation: Prepare 1/10th area as nursery
2. Seed Soaking: Soak seeds for 24 hours before sowing
3. Nursery Sowing: Broadcast treated seeds at 40-50 kg/ha
4. Land Preparation: Plough, puddle soil 2-3 times
5. Transplanting: At 25-30 days, 3-4 seedlings per hill
6. Spacing: 20x15 cm for high-yielding varieties
7. Fertilization: Apply 80 kg N, 40 kg P, 40 kg K per hectare
8. Water Management: 5-10 cm standing water during growth
9. Weeding: Remove weeds at 20-40 days
10. Harvesting: When grain becomes golden, moisture 16-18%
        """,
        "best_practices": """
- Use disease-free certified seeds
- Practice crop rotation to maintain soil health
- Use improved varieties like Basmati, Jasmine, Hybrid varieties
- Adopt SRI (System of Rice Intensification) for higher yields
- Monitor water table carefully
- Use integrated pest management
- Ensure good drainage during rainy season
        """,
        "water_requirements": "1000-1500 mm, including rainfall and irrigation. Requires continuous water.",
        "fertilizer_recommendations": "Nitrogen 80-120 kg/ha, Phosphorus 40 kg/ha, Potassium 40 kg/ha. Timing critical at booting stage.",
        "pest_disease_prevention": """
Pests: Leaf folder, Plant hopper, Gall midge - Use Carbofuran, Imidacloprid
Diseases: Blast, Brown spot - Use Tricyclazole, Mancozeb
Rats: Use rat traps, poison baits, maintain field cleanliness
        """,
        "expected_yield": "50-65 quintals per hectare (hybrid varieties)",
        "market_tips": """
- Basmati rice commands premium prices in international markets
- Parboiling increases shelf life and market value
- Proper drying to 12-14% moisture essential
- Sell through paddy procurement centers for fair price
- Premium prices for organic and specialty rice varieties
        """,
    },
    {
        "name": "Maize",
        "crop_type": "Grain",
        "climate_requirements": "Warm season crop, 21-27°C optimal. 500-750 mm rainfall or irrigation.",
        "soil_type": "Well-drained loamy or clayey loam soil, pH 6.0-7.5",
        "sowing_season": "April-May (Summer/Kharif)",
        "harvesting_time": "August-September",
        "production_steps": """
1. Field Preparation: Plough 3-4 times, create ridges and furrows
2. Seed Treatment: Treat with Thiram + Carbofuran for pest control
3. Sowing: Line sowing at 20-25 kg/ha depth 3-5 cm
4. Spacing: 60x25 cm for single cross hybrids
5. Fertilization: 150 kg N, 60 kg P, 40 kg K per hectare
6. Irrigation: 4-5 irrigations depending on rainfall
7. Weeding: 2-3 hand weedings or herbicide application
8. Thinning: Remove extra plants to maintain spacing
9. Harvesting: When cob turns reddish, moisture 15-18%
10. Post-harvest: Shelling, cleaning, drying
        """,
        "best_practices": """
- Use high-yielding hybrid seeds (Dekalb, Pioneer, Monsanto)
- Adopt line sowing for better plant population
- Use soil moisture conservation techniques
- Follow crop rotation to prevent soil exhaustion
- Use integrated nutrient management
- Adopt improved harvesting and post-harvest techniques
        """,
        "water_requirements": "500-750 mm, requires 4-5 irrigations. Critical at silking and grain filling.",
        "fertilizer_recommendations": "Nitrogen 150 kg/ha (split 3 doses), Phosphorus 60 kg/ha, Potassium 40 kg/ha.",
        "pest_disease_prevention": """
Pests: Shoot fly, Stem borer, Fall armyworm - Use Endosulfan, Chloropyrifos
Diseases: Turcicum leaf blight, Rust - Use Mancozeb, Hexaconazole
Birds: Use bird nets, scare guns during grain filling
        """,
        "expected_yield": "45-60 quintals per hectare (hybrids)",
        "market_tips": """
- Peak demand for corn during monsoon season
- Green corn commands premium prices
- Popcorn varieties fetch higher prices
- Store in cool, dry place to prevent pest damage
- Contract farming with companies provides stable prices
        """,
    },
    {
        "name": "Potato",
        "crop_type": "Vegetable",
        "climate_requirements": "Cool season crop, 15-20°C optimal. Tolerates temperatures up to 25°C.",
        "soil_type": "Light loamy, sandy loam, well-drained. pH 5.5-7.5. Avoid waterlogging.",
        "sowing_season": "September-October (Winter)",
        "harvesting_time": "December-January (90-120 days)",
        "production_steps": """
1. Seed Selection: Use certified seed potatoes (20-25 g weight)
2. Seed Treatment: Treat with Carbendazim before sowing
3. Field Preparation: Plough 4-5 times, form 60 cm wide ridges
4. Spacing: 25 cm between plants, 60 cm between rows
5. Planting: Place seed potatoes at 6-7 cm depth
6. Earthing Up: 2-3 earthing operations at 30 and 50 days
7. Fertilization: 75 kg N, 50 kg P, 60 kg K per hectare
8. Irrigation: 4-5 irrigations for optimal yield
9. Harvesting: 90-120 days, when haulms dry off
10. Storage: In cool, well-ventilated storage at 2-4°C
        """,
        "best_practices": """
- Use disease-free certified seeds for higher yield
- Practice crop rotation (avoid growing potato for 2-3 years)
- Use improved varieties (Kufri Bahar, Kufri Pukhraj)
- Adopt protected cultivation in plains for off-season production
- Use mulching to conserve moisture and prevent greening
- Monitor for late blight during monsoon
        """,
        "water_requirements": "450-600 mm, requires 4-5 irrigations. Critical at tuber initiation.",
        "fertilizer_recommendations": "Nitrogen 75 kg/ha, Phosphorus 50 kg/ha, Potassium 60 kg/ha. Apply full at planting.",
        "pest_disease_prevention": """
Pests: Leaf hopper, Whitefly, Potato tuber moth - Use Imidacloprid, Spinosad
Diseases: Late blight, Early blight - Use Mancozeb, Metalaxyl-M
Rodents: Use poisoned baits, maintain field cleanliness
        """,
        "expected_yield": "20-25 tons per hectare",
        "market_tips": """
- Gloss potatoes fetch higher prices in urban markets
- Supply to processed food industry for premium prices
- Store in cool storage and sell during off-season for profits
- Seed potatoes have good market demand
- Organic potatoes command premium in export markets
        """,
    },
    {
        "name": "Tomato",
        "crop_type": "Vegetable",
        "climate_requirements": "Warm season crop, 20-25°C optimal. Can tolerate 30-35°C with irrigation.",
        "soil_type": "Well-drained loamy soil, slightly acidic. pH 6.0-7.0.",
        "sowing_season": "June-July nursery, transplant August-September",
        "harvesting_time": "November-May (5-6 months)",
        "production_steps": """
1. Nursery: Prepare on raised beds, use light soil with FYM
2. Seed Sowing: 1 gram seed covers 1000 seedlings
3. Seedling Care: Regular watering, shade during summer
4. Field Preparation: Incorporate FYM 25 tons/ha, form ridges
5. Spacing: 60x45 cm for indeterminate, 45x45 for determinate
6. Transplanting: At 6-7 weeks, in evening
7. Staking: Install support for climbing varieties
8. Fertilization: 120 kg N, 60 kg P, 60 kg K per hectare
9. Pruning: Remove side shoots for better fruit quality
10. Harvesting: 20-25 days after flowering, at pink stage
        """,
        "best_practices": """
- Use disease-resistant F1 hybrid varieties (Sungold, Rio Grande)
- Practice crop rotation, avoid solanaceae crops for 3 years
- Use drip irrigation for water efficiency
- Train plants for better air circulation
- Use organic mulch to conserve moisture
- Practice integrated pest management
- Intercrop with basil or garlic for pest control
        """,
        "water_requirements": "400-600 mm, requires 10-15 irrigations. Critical at flowering and fruiting.",
        "fertilizer_recommendations": "Nitrogen 120 kg/ha, Phosphorus 60 kg/ha, Potassium 60 kg/ha. Apply in 2-3 splits.",
        "pest_disease_prevention": """
Pests: Fruit borer, Leaf curl, Whitefly - Use Flubendiamide, Neem oil
Diseases: Early blight, Late blight, Wilt - Use Chlorothalonil, Carbendazim
Physiological: Blossom end rot - Maintain consistent watering
        """,
        "expected_yield": "30-40 tons per hectare",
        "market_tips": """
- Off-season production (March-April) fetches premium prices
- Fresh market tomatoes command higher price than processing
- Supply to hotels/restaurants for bulk orders
- Export to nearby states during high price periods
- Value-added products (paste, puree) provide better returns
        """,
    },
    {
        "name": "Onion",
        "crop_type": "Vegetable",
        "climate_requirements": "Cool season crop, 15-24°C optimal. Requires low humidity for better storage.",
        "soil_type": "Well-drained sandy loam, fertile. pH 6.0-7.5.",
        "sowing_season": "June-July nursery, transplant September-October",
        "harvesting_time": "December-March",
        "production_steps": """
1. Nursery: Sow in raised beds with fine tilth
2. Seedling Care: 5-6 weeks old seedlings ready for planting
3. Field Preparation: Form 15 cm high ridges, incorporate FYM
4. Transplanting: 15x10 cm spacing at 5-6 weeks
5. Fertilization: 100 kg N, 50 kg P, 50 kg K per hectare
6. Irrigation: 5-7 light irrigations during growth
7. Weeding: 3-4 weedings in first 60-70 days
8. Harvesting: When tops dry off, pull and dry for 7-10 days
9. Storage: In well-ventilated storage at 10-15°C
        """,
        "best_practices": """
- Use certified seeds/sets for disease-free crop
- Adopt improved varieties (Nashik Red, Punjab Red)
- Practice crop rotation with non-bulb crops
- Use proper spacing for larger bulb size
- Cure properly before storage to extend shelf life
- Monitor for diseases especially during monsoon
        """,
        "water_requirements": "400-500 mm, requires 5-7 light irrigations.",
        "fertilizer_recommendations": "Nitrogen 100 kg/ha, Phosphorus 50 kg/ha, Potassium 50 kg/ha.",
        "pest_disease_prevention": """
Pests: Thrips, Leaf hopper, Root rot - Use Spinosad, Trichoderma
Diseases: Purple blotch, Basal rot - Use Mancozeb, Carbendazim
Nematodes: Use Carbofuran, maintain field cleanliness
        """,
        "expected_yield": "20-25 tons per hectare",
        "market_tips": """
- Storage helps capture high prices during off-season
- Red onions command premium prices in markets
- Export to neighboring countries for high returns
- Supply to food processing industries
- Organic onions fetch premium prices
        """,
    },
    {
        "name": "Apple",
        "crop_type": "Fruit",
        "climate_requirements": "Cool season fruit, 10-25°C. Requires 4-6 months chilling at <7°C.",
        "soil_type": "Well-drained loamy soil, pH 6.0-7.5. Avoid waterlogged areas.",
        "sowing_season": "October-November (Saplings)",
        "harvesting_time": "August-September (5-7 years after planting)",
        "production_steps": """
1. Site Selection: Cool climate regions, good drainage, wind breaks
2. Sapling Selection: 1-year grafted saplings from nursery
3. Spacing: 4-5 m between plants, 5-6 m between rows
4. Pit Preparation: 1m x 1m x 1m, mix FYM + Neem cake
5. Planting: Plant before dormancy, stake for support
6. Fertilization: 150 kg N, 80 kg P, 100 kg K per hectare (divided)
7. Pruning: Annually for canopy development
8. Thinning: Leave 1 fruit per 25-30 leaves
9. Harvesting: When fruit color develops, handle carefully
10. Grading: Sort by size and quality for premium prices
        """,
        "best_practices": """
- Select suitable varieties for regional climate
- Practice high-density planting (500-650 plants/ha)
- Use drip irrigation for water efficiency
- Mulch to conserve moisture and suppress weeds
- Regular pruning and canopy management
- Integrated pest management essential
- Apply gypsum to prevent bitter pit
        """,
        "water_requirements": "600-1000 mm annually, requires 8-10 irrigations during growing season.",
        "fertilizer_recommendations": "Nitrogen 150 kg/ha, Phosphorus 80 kg/ha, Potassium 100 kg/ha. Split application.",
        "pest_disease_prevention": """
Pests: Codling moth, Scale insect, Sawfly - Use Spinosad, Carbaryl
Diseases: Scab, Powdery mildew - Use Sulfur, Triazole fungicides
Monilia: Use Bordeaux mixture, improve ventilation
        """,
        "expected_yield": "20-25 tons per hectare (mature orchards)",
        "market_tips": """
- Premium prices for large, well-colored fruits
- Storage in cool chambers extends market period
- Export to international markets for high returns
- Organic apples fetch premium prices
- Direct farm sales to consumers for maximum profit
        """,
    },
    {
        "name": "Mango",
        "crop_type": "Fruit",
        "climate_requirements": "Tropical and subtropical, 24-30°C optimal. No frost tolerance.",
        "soil_type": "Well-drained soil, loamy or sandy loam. pH 5.5-7.5.",
        "sowing_season": "June-July (Saplings)",
        "harvesting_time": "March-June (4-5 years after planting)",
        "production_steps": """
1. Nursery: Propagate by softwood grafting (June-July)
2. Sapling Selection: 1-2 year grafted plants
3. Spacing: 10x10 m for commercial orchards
4. Pit Preparation: 1m x 1m x 1m, mix soil with FYM
5. Planting: During monsoon for better establishment
6. Irrigation: Regular during first 2 years
7. Fertilization: 100 kg N, 60 kg P, 80 kg K per hectare
8. Pruning: Remove dead wood, maintain canopy shape
9. Flowering Induction: Reduce irrigation in winter for flowering
10. Harvesting: Full maturity at 100-120 days after flowering
        """,
        "best_practices": """
- Use disease-resistant varieties (Alphonso, Kesar, Chaunsa)
- Intercrop during initial years for better returns
- Use mulching to conserve moisture
- Apply zinc foliar spray to prevent malformation
- Erratic bearing pattern managed by crop regulation
- Harvest manually to prevent bruising
        """,
        "water_requirements": "800-2400 mm depending on climate. Critical at flowering and fruiting.",
        "fertilizer_recommendations": "Nitrogen 100 kg/ha, Phosphorus 60 kg/ha, Potassium 80 kg/ha.",
        "pest_disease_prevention": """
Pests: Fruit fly, Gall wasp, Stem borer - Use Spinosad, Neem oil
Diseases: Anthracnose, Powdery mildew - Use Carbendazim, Sulfur
Mites: Use dicofol, maintain field cleanliness
        """,
        "expected_yield": "15-20 tons per hectare (mature orchards)",
        "market_tips": """
- Staggered harvest extends market period
- Premium prices for quality export varieties
- Harvest at full maturity for best taste and market value
- Use cold chain for longer storage
- Direct sales to exporters/traders for better returns
        """,
    },
    {
        "name": "Banana",
        "crop_type": "Fruit",
        "climate_requirements": "Tropical, 20-30°C optimal. Requires high rainfall or irrigation.",
        "soil_type": "Well-drained fertile soil, rich in organic matter. pH 5.5-7.5.",
        "sowing_season": "June-July (Suckers/Tissue culture plants)",
        "harvesting_time": "9-12 months after planting (Depends on variety)",
        "production_steps": """
1. Sapling Selection: Tissue culture or healthy sword suckers
2. Spacing: 2x2 m for high-density (2000-2500 plants/ha)
3. Pit Preparation: 60x60x60 cm, incorporate FYM 20 kg
4. Mulching: Essential for moisture retention and weed control
5. Fertilization: 150 kg N, 100 kg P, 200 kg K per hectare
6. Irrigation: 10-15 irrigations annually depending on rainfall
7. Sucker Management: Keep 2-3 suckers for continuous harvest
8. Harvesting: 110-130 days, when fruit hands are full size
9. Post-harvest: Dehanding, cleaning, grading
10. Ripening: Ethylene treatment for uniform ripening
        """,
        "best_practices": """
- Use tissue culture plants for disease-free crop
- Adopt high-density planting for better returns
- Intensive mulching for moisture and temperature control
- Proper sucker management for continuous production
- Integrated pest management essential
- Supply to banana chip industries for value addition
        """,
        "water_requirements": "1500-2250 mm. Requires 10-15 irrigations in dry season.",
        "fertilizer_recommendations": "Nitrogen 150 kg/ha, Phosphorus 100 kg/ha, Potassium 200 kg/ha. Split application.",
        "pest_disease_prevention": """
Pests: Banana weevil, Scale insect, Mites - Use Carbofuran, Neem oil
Diseases: Panama wilt, Leaf spot - Use resistant varieties, soil drenching
Sigatoka: Use Mancozeb, improve air circulation
        """,
        "expected_yield": "30-40 tons per hectare",
        "market_tips": """
- Year-round production ensures continuous income
- Fresh fruit market and processing both viable
- Supply to fruit chains and retailers
- Banana chips and dried banana profitable
- Export potential to international markets
        """,
    },
    {
        "name": "Sugarcane",
        "crop_type": "Cash Crop",
        "climate_requirements": "Warm season, 21-27°C optimal. Annual rainfall 1000-2500 mm.",
        "soil_type": "Deep, fertile, well-drained loamy soil. pH 6.0-7.5.",
        "sowing_season": "October-December",
        "harvesting_time": "October-December (12-14 months)",
        "production_steps": """
1. Seed Selection: Use disease-free seed cane (2-3 buds)
2. Seed Treatment: Treat with Carbendazim + Insecticide
3. Sowing: Line sowing at 75 cm spacing, 25 tons seed/ha
4. Fertilization: 150 kg N, 80 kg P, 80 kg K per hectare
5. Ratoon Management: Cut 15-20 cm above soil level
6. Irrigation: 10-12 heavy irrigations in dry areas
7. Trash Farming: Keep trash for mulch and moisture conservation
8. Weeding: 2-3 hand weedings or herbicide application
9. Harvesting: When maturity achieved (10-12 months)
10. Transport: Quick transport to mill for sugar extraction
        """,
        "best_practices": """
- Use improved varieties resistant to diseases
- Practice crop rotation (2-3 years with other crops)
- Adopt conservation agriculture for sustainability
- Use organic mulch for temperature moderation
- Integrated pest and disease management
- Timely harvesting and transport to mill
- Contract farming ensures better prices
        """,
        "water_requirements": "1500-2250 mm, requires 10-12 heavy irrigations. Critical at grand growth stage.",
        "fertilizer_recommendations": "Nitrogen 150 kg/ha, Phosphorus 80 kg/ha, Potassium 80 kg/ha. Split application.",
        "pest_disease_prevention": """
Pests: Stem borer, Top shoot borer, Thrips - Use Carbofuran, Imidacloprid
Diseases: Red rot, Wilt, Smut - Use disease-free seed, crop rotation
Rodents: Use poisoned baits, maintain field cleanliness
        """,
        "expected_yield": "60-80 tons per hectare (including ratoons)",
        "market_tips": """
- Sell to approved sugar mills for guaranteed price
- Government support price (MSP) ensures minimum income
- Timely harvesting crucial for sugar content
- Contract farming with mills provides stability
- Bagasse useful as fuel, compost, and paper making
        """,
    },
    {
        "name": "Cotton",
        "crop_type": "Cash Crop",
        "climate_requirements": "Warm season, 21-30°C optimal. Requires 600-1000 mm rainfall.",
        "soil_type": "Well-drained black soil or loam. pH 6.0-8.5.",
        "sowing_season": "May-June (depending on rainfall)",
        "harvesting_time": "September-December (6-7 months)",
        "production_steps": """
1. Seed Treatment: Treat with Thiram + Imidacloprid for protection
2. Sowing: Line sowing at 60-90 cm spacing, 20-25 kg seed/ha
3. Seedbed: Fine, well-prepared seedbed essential
4. Fertilization: 120 kg N, 60 kg P, 60 kg K per hectare
5. Irrigation: 5-6 irrigations depending on rainfall
6. Hoeing: 2-3 hoeing for weed control
7. Defoliation: Chemical or manual before harvest
8. Harvesting: Hand picking when bolls open (3-4 pickings)
9. Ginning: Remove seeds from fiber at cotton gin
10. Baling: Pack for sale at regulated market
        """,
        "best_practices": """
- Use Bt cotton varieties for pest management
- Adopt organic cotton for premium prices
- Intercropping with pulses for soil health
- Crop rotation to prevent soil exhaustion
- Drip irrigation for water conservation
- Integrated pest management essential
- Regular monitoring for early problem identification
        """,
        "water_requirements": "600-1000 mm, requires 5-6 irrigations. Critical at flowering and boll development.",
        "fertilizer_recommendations": "Nitrogen 120 kg/ha, Phosphorus 60 kg/ha, Potassium 60 kg/ha.",
        "pest_disease_prevention": """
Pests: Bollworm, Spotted bollworm, Aphid - Use Spinosad, Neem oil
Diseases: Leaf curl, Wilt - Use virus-resistant varieties
Sucking insects: Use imidacloprid, maintain field cleanliness
        """,
        "expected_yield": "20-25 quintals of seed cotton per hectare",
        "market_tips": """
- Sell at regulated cotton markets for transparent pricing
- Organic cotton fetches 20-30% premium
- Establish direct contacts with spinners
- Grade and sort properly before selling
- Government MSP provides price support
        """,
    },
    {
        "name": "Mustard",
        "crop_type": "Cash Crop",
        "climate_requirements": "Cool season crop, 15-25°C optimal. Tolerates frost.",
        "soil_type": "Well-drained loam or clay loam. pH 6.0-7.5.",
        "sowing_season": "September-October",
        "harvesting_time": "February-March",
        "production_steps": """
1. Field Preparation: 2-3 ploughings, fine tilth
2. Seed Rate: 4-5 kg/ha for line sowing
3. Spacing: 30-45 cm between rows, 10-15 cm between plants
4. Sowing: Line sowing preferred for better management
5. Fertilization: 60 kg N, 40 kg P, 40 kg K per hectare
6. Irrigation: 2-3 light irrigations in dry areas
7. Weeding: 1-2 weedings at 30-40 days
8. Harvesting: When pods turn brown, seeds black
9. Threshing: Manual or mechanical threshing
10. Cleaning and Grading: Remove foreign material
        """,
        "best_practices": """
- Use improved varieties (Varuna, Pusa Bold)
- Adopt line sowing for better yields
- Crop rotation with cereals beneficial
- Integrated pest management
- Timely weeding crucial for yield
- Storage in moisture-proof containers
        """,
        "water_requirements": "400-600 mm, requires 2-3 light irrigations in dry areas.",
        "fertilizer_recommendations": "Nitrogen 60 kg/ha, Phosphorus 40 kg/ha, Potassium 40 kg/ha.",
        "pest_disease_prevention": """
Pests: Sawfly, Seed siliquae fly, Aphid - Use Malathion, Neem spray
Diseases: Alternaria leaf spot, White rust - Use Mancozeb
Rodents: Use poisoned baits during harvest season
        """,
        "expected_yield": "15-20 quintals per hectare",
        "market_tips": """
- Mustard oil prices peak during winter season
- Supply to oil extractors for stable income
- Organic mustard seeds fetch premium
- Mustard meal valuable as cattle feed
- Export quality seeds in high demand
        """,
    },
    {
        "name": "Chickpea",
        "crop_type": "Grain (Pulse)",
        "climate_requirements": "Cool season crop, 15-24°C optimal. Frost tolerant.",
        "soil_type": "Well-drained medium black soil, loam. pH 6.0-7.5.",
        "sowing_season": "October-November",
        "harvesting_time": "February-March",
        "production_steps": """
1. Field Preparation: 2-3 ploughings, good seed bed
2. Seed Treatment: Treat with Rhizobium culture and Fungicide
3. Sowing: Line sowing at 30 cm spacing, 15-20 kg seed/ha
4. Fertilization: 20 kg N, 50 kg P, 20 kg K per hectare (P critical)
5. Irrigation: 1-2 irrigations, mostly rainfed crop
6. Weeding: 1-2 hand weedings at 30-50 days
7. Pest Management: Integrated approach essential
8. Harvesting: When pods turn brown, pods rattle
9. Threshing: Manual or mechanical threshing
10. Storage: In cool, dry place to prevent pest damage
        """,
        "best_practices": """
- Use improved varieties (Jaki-9218, JG-11)
- Inoculate seeds with Rhizobium for N fixation
- Adopt organic farming for premium prices
- Crop rotation essential with cereals
- Drip irrigation beneficial in dry regions
- Use biological pest control
        """,
        "water_requirements": "400-500 mm (mostly from rainfall), 1-2 irrigations in dry season.",
        "fertilizer_recommendations": "Nitrogen 20 kg/ha, Phosphorus 50 kg/ha, Potassium 20 kg/ha. Higher P for nodulation.",
        "pest_disease_prevention": """
Pests: Gram pod borer, Gram seed beetle - Use Spinosad, Neem oil
Diseases: Wilt, Blight, Root rot - Use disease-resistant varieties
Nematodes: Use Trichoderma, maintain crop rotation
        """,
        "expected_yield": "15-20 quintals per hectare",
        "market_tips": """
- Organic chickpea commands premium prices
- Premium for large, bold seeds
- Export market strong for Indian chickpea
- Supply to processing units for value addition
- Direct sales to consumers for better margins
        """,
    },
    {
        "name": "Garlic",
        "crop_type": "Vegetable",
        "climate_requirements": "Cool season crop, 10-20°C optimal for bulb development.",
        "soil_type": "Well-drained fertile soil, rich in organic matter. pH 6.0-7.5.",
        "sowing_season": "September-October (Cloves)",
        "harvesting_time": "April-May (7-8 months)",
        "production_steps": """
1. Seed Selection: Disease-free large cloves (>2g), healthy bulbs
2. Clove Treatment: Soak in Carbendazim solution
3. Field Preparation: Form 15 cm ridges, incorporate FYM 20 tons/ha
4. Spacing: 20x10 cm for better bulb size
5. Planting: Cloves 3-4 cm deep, pointed side up
6. Fertilization: 100 kg N, 50 kg P, 40 kg K per hectare
7. Irrigation: 5-6 light irrigations for optimal growth
8. Weeding: 3-4 weedings essential for bulb development
9. Harvesting: When leaves dry (80-90%), pull carefully
10. Curing: Dry for 10-15 days before storage
        """,
        "best_practices": """
- Use large, healthy cloves from certified sources
- Avoid waterlogged conditions during monsoon
- Mulching helps temperature regulation
- Crop rotation with legumes beneficial
- Organic farming increases premium value
- Proper curing ensures longer shelf life
        """,
        "water_requirements": "400-500 mm, requires 5-6 light irrigations for good bulb development.",
        "fertilizer_recommendations": "Nitrogen 100 kg/ha, Phosphorus 50 kg/ha, Potassium 40 kg/ha.",
        "pest_disease_prevention": """
Pests: Thrips, Mites, Root rot - Use Spinosad, Trichoderma
Diseases: Purple blotch, White rot - Use Mancozeb, Carbendazim
Rodents: Use poisoned baits, maintain field cleanliness
        """,
        "expected_yield": "10-15 tons per hectare",
        "market_tips": """
- Peak prices during monsoon season
- Storage in cool conditions extends market period
- Organic garlic fetches premium prices
- Export markets have high demand
- Processing into paste/powder adds value
        """,
    },
    {
        "name": "Ginger",
        "crop_type": "Vegetable",
        "climate_requirements": "Warm, humid tropical climate, 20-30°C optimal. High rainfall needed.",
        "soil_type": "Well-drained loose fertile loam, rich in organic matter. pH 5.5-6.5.",
        "sowing_season": "February-May (Rhizomes)",
        "harvesting_time": "November-December (8-10 months)",
        "production_steps": """
1. Rhizome Selection: Disease-free, well-developed, 20-25 g weight
2. Treatment: Soak in Trichoderma solution for disease control
3. Field Preparation: Form 30 cm ridges, incorporate FYM 25 tons/ha
4. Spacing: 25x20 cm for optimal rhizome development
5. Planting: Rhizomes 2-3 cm deep in moist soil
6. Mulching: 10-15 tons dry leaves/grass for moisture
7. Fertilization: 75 kg N, 50 kg P, 50 kg K per hectare
8. Irrigation: 12-15 irrigations during dry season
9. Weeding: 3-4 weedings with light hoeing
10. Harvesting: When leaves dry off, dig carefully
        """,
        "best_practices": """
- Use certified disease-free rhizomes
- Crop rotation with legumes essential
- Shade farming increases yield and quality
- Avoid waterlogging, improve drainage
- Mulching critical for moisture and temperature
- Integrated pest management approach
- Proper curing improves shelf life
        """,
        "water_requirements": "1500-2250 mm, requires 12-15 irrigations in dry areas.",
        "fertilizer_recommendations": "Nitrogen 75 kg/ha, Phosphorus 50 kg/ha, Potassium 50 kg/ha.",
        "pest_disease_prevention": """
Pests: Root scale, Mites, Shoot borer - Use Carbofuran, Neem oil
Diseases: Leaf blotch, Rhizome rot - Use Bordeaux mixture, Trichoderma
Nematodes: Use Carbofuran, maintain proper drainage
        """,
        "expected_yield": "20-25 tons per hectare (fresh)",
        "market_tips": """
- Fresh ginger peak demand in monsoon
- Dried ginger exports profitable
- Organic ginger commands premium prices
- Processing into powder and paste adds value
- Direct farm sales to processors for better returns
        """,
    },
]

def seed_crops():
    """Seed the database with crop information"""
    db = next(get_db())
    
    try:
        # Check if crops already exist
        existing_count = db.query(CropInfo).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} crop records. Skipping seeding.")
            return
        
        # Add all crops
        for crop in crops_data:
            crop_info = CropInfo(**crop)
            db.add(crop_info)
        
        db.commit()
        print(f"Successfully seeded {len(crops_data)} crops into the database!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding crops: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    seed_crops()
