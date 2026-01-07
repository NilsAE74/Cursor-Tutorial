import * as THREE from 'three';

/**
 * Parser for XYZ-filer
 * Leser fil-innhold og konverterer til Three.js-geometri med farger
 */
export function parseXYZFile(content) {
  const lines = content.split('\n');
  const positions = [];
  const colors = [];
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  // Første pass: finn min/max for alle akser
  const tempPoints = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue; // Hopp over tomme linjer og kommentarer
    
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parseFloat(parts[2]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        tempPoints.push({ x, y, z });
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }
    }
  }
  
  console.log(`Antall punkter funnet: ${tempPoints.length}`);
  console.log(`X range: ${minX.toFixed(2)} til ${maxX.toFixed(2)}`);
  console.log(`Y range: ${minY.toFixed(2)} til ${maxY.toFixed(2)}`);
  console.log(`Z range: ${minZ.toFixed(2)} til ${maxZ.toFixed(2)}`);
  
  // Andre pass: opprett posisjon og farge-arrays
  const zRange = maxZ - minZ || 1; // Unngå divisjon med null
  
  for (const point of tempPoints) {
    positions.push(point.x, point.y, point.z);
    
    // Fargelegg basert på Z-verdi (gradient fra blå til rød)
    const normalizedZ = (point.z - minZ) / zRange;
    const color = new THREE.Color();
    color.setHSL(0.6 - normalizedZ * 0.6, 1.0, 0.5); // Blå (0.6) til rød (0.0)
    colors.push(color.r, color.g, color.b);
  }
  
  return { 
    positions, 
    colors, 
    count: tempPoints.length,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ }
  };
}

/**
 * Sentrer posisjon-array rundt origo for bedre WebGL-presisjon
 * Returnerer sentrerte posisjoner og offset-verdiene
 */
export function centerPositions(positions, bounds) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  
  console.log(`Sentrerer punktsky. Offset: (${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)})`);
  
  const centeredPositions = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    centeredPositions[i] = positions[i] - centerX;
    centeredPositions[i + 1] = positions[i + 1] - centerY;
    centeredPositions[i + 2] = positions[i + 2] - centerZ;
  }
  
  return { 
    centeredPositions, 
    offset: { x: centerX, y: centerY, z: centerZ } 
  };
}
