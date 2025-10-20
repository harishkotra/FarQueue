"use strict";
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
require("dotenv/config"); // Load environment variables
var node_cron_1 = require("node-cron");
var nodejs_sdk_1 = require("@neynar/nodejs-sdk");
var promise_1 = require("mysql2/promise");
var neynarClient = new nodejs_sdk_1.NeynarAPIClient(process.env.NEYNAR_API_KEY);
var dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
function publishDueCasts() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, now, dueCasts, _i, dueCasts_1, cast, result, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connection = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 11, 12, 15]);
                    return [4 /*yield*/, promise_1.default.createConnection(dbConfig)];
                case 2:
                    connection = _a.sent();
                    now = new Date();
                    return [4 /*yield*/, connection.execute("SELECT sc.id, sc.cast_text, u.signer_uuid\n             FROM scheduled_casts sc\n             JOIN users u ON sc.user_fid = u.fid\n             WHERE sc.is_published = FALSE AND sc.publish_at <= ?", [now])];
                case 3:
                    dueCasts = (_a.sent())[0];
                    if (dueCasts.length === 0) {
                        console.log('No casts to publish at this time.');
                        return [2 /*return*/];
                    }
                    console.log("Found ".concat(dueCasts.length, " casts to publish."));
                    _i = 0, dueCasts_1 = dueCasts;
                    _a.label = 4;
                case 4:
                    if (!(_i < dueCasts_1.length)) return [3 /*break*/, 10];
                    cast = dueCasts_1[_i];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 8, , 9]);
                    return [4 /*yield*/, neynarClient.publishCast(cast.signer_uuid, cast.cast_text)];
                case 6:
                    result = _a.sent();
                    return [4 /*yield*/, connection.execute('UPDATE scheduled_casts SET is_published = TRUE, published_hash = ? WHERE id = ?', [result.hash, cast.id])];
                case 7:
                    _a.sent();
                    console.log("Successfully published cast ".concat(cast.id, " with hash ").concat(result.hash));
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error("Failed to publish cast ".concat(cast.id, ":"), error_1.message);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 4];
                case 10: return [3 /*break*/, 15];
                case 11:
                    error_2 = _a.sent();
                    console.error('Error in cron job:', error_2.message);
                    return [3 /*break*/, 15];
                case 12:
                    if (!connection) return [3 /*break*/, 14];
                    return [4 /*yield*/, connection.end()];
                case 13:
                    _a.sent();
                    _a.label = 14;
                case 14: return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// Schedule the job to run every minute
node_cron_1.default.schedule('* * * * *', publishDueCasts);
console.log('Cron job for publishing casts has been started.');
