import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

async function main() {
  await client.connect();
  console.log("Connected to MongoDB");

  const asset_db = client.db("asset-management");
  const session_db = client.db("sessions");

  const assets = await asset_db
    .collection("assets")
    .find({ "sitePartners.id": process.env.SITE_PARTNER_ID })
    .toArray();

  console.log("Found", assets.length, "assets");

  const sessions = await session_db
    .collection("session")
    .find({
      "chargingStation.id": { $in: assets.map((a) => a.id) },
      startTime: { $gte: new Date("2023-01-01") },
      status: "COMPLETE",
    })
    .toArray();

  console.log("Found", sessions.length, "sessions");

  const totalCost = sessions.reduce((acc, s) => acc + s.cost, 0);
  console.log("Total cost: $", totalCost / 100);

  const totalEnergyUsed = sessions.reduce(
    (acc, s) => acc + s.costDetails.usages.energy,
    0
  );
  console.log("Total energy used: ", totalEnergyUsed / 1000, "kWh");

  await client.close();
}

main();
