#!/usr/bin/env python3
import os
import time
import asyncio
import httpx

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8001")
N = int(os.getenv("N", "100"))          # total requests
CONC = int(os.getenv("CONC", "20"))     # concurrency

async def worker(client: httpx.AsyncClient, sem: asyncio.Semaphore, idx: int):
    async with sem:
        r = await client.get("/health")
        r.raise_for_status()
        return r.json()

async def main():
    sem = asyncio.Semaphore(CONC)
    t0 = time.time()

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        tasks = [worker(client, sem, i) for i in range(N)]
        results = await asyncio.gather(*tasks)

    dt = time.time() - t0
    print(f"BASE_URL={BASE_URL}")
    print(f"Requests: {N}, Concurrency: {CONC}")
    print(f"Total time: {dt:.2f}s, RPS: {N/dt:.2f}")
    print("Sample response:", results[0])

if __name__ == "__main__":
    asyncio.run(main())
