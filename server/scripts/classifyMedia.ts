import { classifyPendingMedia, getClassificationStats } from "../imageClassificationService";

async function main() {
  console.log("=".repeat(60));
  console.log("AI IMAGE CLASSIFICATION (Gemini 1.5 Flash)");
  console.log("=".repeat(60));
  
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 20;
  const statsOnly = args.includes('--stats');
  
  const initialStats = await getClassificationStats();
  console.log("\nCurrent Status:");
  console.log(`  Total photos: ${initialStats.total}`);
  console.log(`  Pending: ${initialStats.pending}`);
  console.log(`  Processed: ${initialStats.processed}`);
  console.log(`  Errors: ${initialStats.errors}`);
  
  if (Object.keys(initialStats.byLabel).length > 0) {
    console.log("\nLabels breakdown:");
    for (const [label, count] of Object.entries(initialStats.byLabel)) {
      console.log(`  ${label}: ${count}`);
    }
  }
  
  if (statsOnly) {
    console.log("\n--stats flag provided, skipping classification.");
    return;
  }
  
  if (initialStats.pending === 0) {
    console.log("\nNo pending photos to classify.");
    return;
  }
  
  console.log(`\nClassifying up to ${limit} photos...\n`);
  
  const { processed, errors } = await classifyPendingMedia(limit);
  
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Processed: ${processed}`);
  console.log(`Errors: ${errors}`);
  
  const finalStats = await getClassificationStats();
  console.log(`\nRemaining pending: ${finalStats.pending}`);
}

main()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
