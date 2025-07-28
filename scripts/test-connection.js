"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_1 = require("@neondatabase/serverless");
var dotenv = require("dotenv");
dotenv.config({ path: '.env.local' });
function testConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var sql, result, tables, roles, e_1, users, e_2, jobTypes, e_3, jobs, e_4, completedJobs, e_5, accruedValues, e_6, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🧪 Testing database connection...");
                    if (!process.env.DATABASE_URL) {
                        console.error("❌ DATABASE_URL not found in environment variables");
                        console.log("Make sure you have a .env.local file with:");
                        console.log("DATABASE_URL=your-neon-connection-string");
                        return [2 /*return*/];
                    }
                    console.log("📝 DATABASE_URL found:", process.env.DATABASE_URL.substring(0, 30) + "...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 24, , 25]);
                    sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
                    return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1 as test"], ["SELECT 1 as test"])))];
                case 2:
                    result = _a.sent();
                    console.log("✅ Connection successful!");
                    console.log("📊 Test query result:", result);
                    return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      SELECT table_name \n      FROM information_schema.tables \n      WHERE table_schema = 'public' \n      ORDER BY table_name\n    "], ["\n      SELECT table_name \n      FROM information_schema.tables \n      WHERE table_schema = 'public' \n      ORDER BY table_name\n    "])))];
                case 3:
                    tables = _a.sent();
                    console.log("\uD83D\uDCCB Found ".concat(tables.length, " tables:"));
                    tables.forEach(function (table) {
                        console.log("  - ".concat(table.table_name));
                    });
                    if (!(tables.length === 0)) return [3 /*break*/, 4];
                    console.log("⚠️  No tables found. Run the setup script to create them.");
                    return [3 /*break*/, 23];
                case 4:
                    // Test some key tables
                    console.log("\n🔍 Testing key tables:");
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["SELECT COUNT(*) as count FROM roles"], ["SELECT COUNT(*) as count FROM roles"])))];
                case 6:
                    roles = _a.sent();
                    console.log("  \u2705 Roles: ".concat(roles[0].count, " records"));
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _a.sent();
                    console.log("  ❌ Roles table issue");
                    return [3 /*break*/, 8];
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["SELECT COUNT(*) as count FROM users"], ["SELECT COUNT(*) as count FROM users"])))];
                case 9:
                    users = _a.sent();
                    console.log("  \u2705 Users: ".concat(users[0].count, " records"));
                    return [3 /*break*/, 11];
                case 10:
                    e_2 = _a.sent();
                    console.log("  ❌ Users table issue");
                    return [3 /*break*/, 11];
                case 11:
                    _a.trys.push([11, 13, , 14]);
                    return [4 /*yield*/, sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["SELECT COUNT(*) as count FROM job_types"], ["SELECT COUNT(*) as count FROM job_types"])))];
                case 12:
                    jobTypes = _a.sent();
                    console.log("  \u2705 Job Types: ".concat(jobTypes[0].count, " records"));
                    return [3 /*break*/, 14];
                case 13:
                    e_3 = _a.sent();
                    console.log("  ❌ Job Types table issue");
                    return [3 /*break*/, 14];
                case 14:
                    _a.trys.push([14, 16, , 17]);
                    return [4 /*yield*/, sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["SELECT COUNT(*) as count FROM jobs"], ["SELECT COUNT(*) as count FROM jobs"])))];
                case 15:
                    jobs = _a.sent();
                    console.log("  \u2705 Jobs: ".concat(jobs[0].count, " records"));
                    return [3 /*break*/, 17];
                case 16:
                    e_4 = _a.sent();
                    console.log("  ❌ Jobs table issue");
                    return [3 /*break*/, 17];
                case 17:
                    _a.trys.push([17, 19, , 20]);
                    return [4 /*yield*/, sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'"], ["SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'"])))];
                case 18:
                    completedJobs = _a.sent();
                    console.log("  \u2705 Completed Jobs: ".concat(completedJobs[0].count, " records"));
                    return [3 /*break*/, 20];
                case 19:
                    e_5 = _a.sent();
                    console.log("  ❌ Completed Jobs table issue");
                    return [3 /*break*/, 20];
                case 20:
                    _a.trys.push([20, 22, , 23]);
                    return [4 /*yield*/, sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["SELECT COUNT(*) as count FROM accrued_values"], ["SELECT COUNT(*) as count FROM accrued_values"])))];
                case 21:
                    accruedValues = _a.sent();
                    console.log("  \u2705 Accrued Values: ".concat(accruedValues[0].count, " records"));
                    return [3 /*break*/, 23];
                case 22:
                    e_6 = _a.sent();
                    console.log("  ❌ Accrued Values table issue");
                    return [3 /*break*/, 23];
                case 23: return [3 /*break*/, 25];
                case 24:
                    error_1 = _a.sent();
                    console.error("❌ Connection failed:");
                    console.error(error_1);
                    if (error_1 instanceof Error) {
                        if (error_1.message.includes("getaddrinfo ENOTFOUND")) {
                            console.log("\n💡 This looks like a network/DNS issue");
                            console.log("- Check your internet connection");
                            console.log("- Verify your Neon database URL is correct");
                        }
                        else if (error_1.message.includes("password authentication failed")) {
                            console.log("\n💡 Authentication failed");
                            console.log("- Check your database credentials");
                            console.log("- Make sure your Neon database is active");
                        }
                    }
                    return [3 /*break*/, 25];
                case 25: return [2 /*return*/];
            }
        });
    });
}
testConnection();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8;
