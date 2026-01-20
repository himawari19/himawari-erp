"use client";

import { useState } from "react";
import { addCustomer, getCustomers } from "../master/customers/actions";
import { checkout } from "../pos/actions";
import { getUsers, createUser } from "../users/actions";

export default function TestBEPage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const log = (name: string, data: any) => {
        setResults(prev => [...prev, { name, timestamp: new Date().toLocaleTimeString(), data: JSON.stringify(data, null, 2) }]);
    };

    const runTests = async () => {
        setLoading(true);
        setResults([]);

        // 1. Test Customer Creation
        try {
            const formData = new FormData();
            formData.append("name", "BE Test Customer " + Date.now());
            formData.append("phone", "0812345678");
            await addCustomer(formData);
            log("Add Customer", "SUCCESS");
        } catch (e: any) {
            log("Add Customer ERROR", e.message);
        }

        // 2. Test Fetching Customers
        try {
            const customers = await getCustomers();
            log("Get Customers", { count: customers.length, first: customers[0]?.name });
        } catch (e: any) {
            log("Get Customers ERROR", e.message);
        }

        // 3. Test POS Checkout (Simulated)
        // Note: This needs a real product ID to work properly.
        // I'll try with a dummy check just to see the error type.
        try {
            const result = await checkout([{ id: "99999999-9999-9999-9999-999999999999", name: "Fake", quantity: 1, sell_price: 1000, sku: "FAKE" }]);
            log("Checkout (Dummy Product)", result);
        } catch (e: any) {
            log("Checkout ERROR", e.message);
        }

        setLoading(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Backend Action Tester</h1>
            <button
                onClick={runTests}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
                {loading ? "Running..." : "Run All Tests"}
            </button>

            <div className="space-y-4">
                {results.map((r, i) => (
                    <div key={i} className="p-4 border rounded-lg bg-gray-50 font-mono text-sm whitespace-pre-wrap">
                        <div className="font-bold text-indigo-600 mb-2">[{r.timestamp}] {r.name}</div>
                        {r.data}
                    </div>
                ))}
            </div>
        </div>
    );
}
