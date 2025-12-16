async function run() {
  const BASE = 'http://localhost:3000';
  const ok = (r) => r && r.success === true;

  try {
    console.log('Checking /health...');
    let res = await fetch(`${BASE}/health`);
    let j = await res.json();
    console.log('/health ->', j);
    if (!ok(j)) throw new Error('/health failed');

    console.log('Resetting DB...');
    res = await fetch(`${BASE}/reset`, { method: 'POST' });
    j = await res.json();
    console.log('/reset ->', j);
    if (!ok(j)) throw new Error('/reset failed');

    console.log('Listing products...');
    res = await fetch(`${BASE}/products`);
    j = await res.json();
    console.log('/products -> count:', Array.isArray(j.data) ? j.data.length : 'no-data');
    if (!ok(j)) throw new Error('/products failed');

    const prod = j.data[0];
    console.log('Adding acceptance transaction for', prod.id);
    res = await fetch(`${BASE}/transactions/acceptance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: prod.id, quantity: 2, price: prod.price })
    });
    j = await res.json();
    console.log('/transactions/acceptance ->', j);
    if (!ok(j)) throw new Error('acceptance failed');

    console.log('Listing transactions...');
    res = await fetch(`${BASE}/transactions`);
    j = await res.json();
    console.log('/transactions -> count:', Array.isArray(j.data) ? j.data.length : 'no-data');
    if (!ok(j)) throw new Error('/transactions failed');

    // Update product
    console.log('Updating product', prod.id);
    res = await fetch(`${BASE}/products/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: prod.name + ' (updated)', price: prod.price + 1000 })
    });
    j = await res.json();
    console.log('/products/:id PUT ->', j);
    if (!ok(j)) throw new Error('update product failed');

    console.log('Trying login with bad pin...');
    res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '0000' })
    });
    if (res.ok) {
      const rj = await res.json();
      console.log('/login bad ->', rj);
    } else {
      console.log('/login bad -> status', res.status);
    }

    console.log('Trying login with correct pin...');
    res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '1234' })
    });
    j = await res.json();
    console.log('/login ok ->', j);
    if (!j.success) throw new Error('login failed');

    // Delete the last transaction returned
    console.log('Deleting last transaction if exists');
    res = await fetch(`${BASE}/transactions/${j.data && j.data.length ? j.data[0].id : ''}`, { method: 'DELETE' });
    // If the call was invalid, just ignore

    console.log('All tests passed.');
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(1);
  }
}

run();
