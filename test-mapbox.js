const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'PLACEHOLDER';
const url = `https://api.mapbox.com/directions/v5/mapbox/driving/-71.9388,-13.5358;-71.9774,-13.5155?geometries=geojson&overview=full&access_token=${token}`;
fetch(url).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2))).catch(console.error);