const fs = require('fs');
let code = fs.readFileSync('src/lib/admin.actions.ts', 'utf8');

const authCode = `
import { cookies } from "next/headers";
import { checkAdminPhone } from "./orders.functions";

export async function setAdminAuthCookie(token: string) {
    cookies().set("veloiz_admin_token", token, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearAdminAuthCookie() {
    cookies().delete("veloiz_admin_token");
}

async function requireAdmin() {
    const token = cookies().get("veloiz_admin_token")?.value;
    if (!token) throw new Error("Unauthorized: Missing Admin Token");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user || !data.user.phone) throw new Error("Unauthorized: Invalid Token");
    
    // Strict DB security context double-verification
    const isAllowed = await checkAdminPhone(data.user.phone);
    if (!isAllowed) throw new Error("Unauthorized: Phone number not on Veloiz Admin Allowlist");
}

`;

if (!code.includes("requireAdmin")) {
    code = code.replace('"use server";', '"use server";\n' + authCode);
}

const names = ['fetchDashboard', 'fetchAnalytics', 'fetchProducts', 'fetchCategories', 'fetchOrders', 'fetchSettings', 'saveProduct', 'deleteProduct', 'saveCategory', 'deleteCategory', 'updateOrderStatus', 'updateInventory', 'saveSettings'];

for (const name of names) {
    code = code.replace(
        new RegExp(`export async function ${name}\\(.*?\\)\\s*\\{`), 
        (match) => match + '\n    await requireAdmin();'
    );
}

fs.writeFileSync('src/lib/admin.actions.ts', code);
