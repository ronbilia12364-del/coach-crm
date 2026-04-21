#!/usr/bin/env node
const webPush = require("web-push");
const keys = webPush.generateVAPIDKeys();
console.log("\n=== VAPID Keys (add to Vercel Environment Variables) ===\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_SUBJECT=mailto:admin@coach-crm.com");
console.log("\n========================================================\n");
