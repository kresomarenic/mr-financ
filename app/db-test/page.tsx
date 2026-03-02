// app/db-test/page.tsx
import { dbPing } from "@/lib/db";

export default async function DbTestPage() {
    const now = await dbPing();
    return (
        <main style={{ padding: 24 }}>
            <h1>DB Test</h1>
            <p>Connected. Server time: {now}</p>
        </main>
    );
}