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

/**
 * Genererer en syntetisk default punktsky for testing
 * - 100x100 meter terreng
 * - Ca. 10 000 punkter
 * - Høydevariasjoner mellom 0 og 10 meter
 * - Realistiske UTM-koordinater (500.000 / 6.000.000 område)
 */
export function generateDefaultCloud() {
  console.log('Genererer default punktsky...');
  
  const positions = [];
  const colors = [];
  
  // UTM-koordinater i 500.000 / 6.000.000 området
  const baseX = 500000;
  const baseY = 6000000;
  const baseZ = -70;
  
  // Terrengstørrelse: 100x100 meter
  const sizeX = 100;
  const sizeY = 100;
  
  // Ca. 10 000 punkter (100x100 = 10 000)
  const gridResX = 100;
  const gridResY = 100;
  
  const stepX = sizeX / (gridResX - 1);
  const stepY = sizeY / (gridResY - 1);
  
  let minZ = Infinity;
  let maxZ = -Infinity;
  
  // Generer punkter med variert terreng
  const tempPoints = [];
  for (let i = 0; i < gridResX; i++) {
    for (let j = 0; j < gridResY; j++) {
      const x = baseX + (i * stepX);
      const y = baseY + (j * stepY);
      
      // Bruk flere sinus-bølger for å lage et interessant terreng
      // Kombinerer store bølger med små bølger for naturlig utseende
      const wave1 = Math.sin(i / 10) * 3;  // Store bølger (3m amplitude)
      const wave2 = Math.sin(j / 8) * 2;   // Medium bølger (2m amplitude)
      const wave3 = Math.sin(i / 3) * Math.cos(j / 4) * 1.5;  // Små bølger (1.5m amplitude)
      const wave4 = Math.sin((i + j) / 15) * 2.5;  // Diagonale bølger
      
      // Legg til litt "støy" for mer naturlig variasjon
      const noise = (Math.sin(i * 0.5) * Math.cos(j * 0.7) + 
                     Math.sin(i * 1.3) * Math.cos(j * 1.1)) * 0.5;
      
      // Kombiner alle bølger og skaler til 0-10 meter
      let z = baseZ + 5 + wave1 + wave2 + wave3 + wave4 + noise;
      
      // Sikre at z er innenfor 0-10 meter
      z = Math.max(baseZ, Math.min(baseZ + 10, z));
      
      tempPoints.push({ x, y, z });
      
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }
  
  console.log(`Default punktsky generert: ${tempPoints.length} punkter`);
  console.log(`X range: ${baseX.toFixed(2)} til ${(baseX + sizeX).toFixed(2)}`);
  console.log(`Y range: ${baseY.toFixed(2)} til ${(baseY + sizeY).toFixed(2)}`);
  console.log(`Z range: ${minZ.toFixed(2)} til ${maxZ.toFixed(2)}`);
  
  // Opprett posisjon og farge-arrays
  const zRange = maxZ - minZ || 1;
  
  for (const point of tempPoints) {
    positions.push(point.x, point.y, point.z);
    
    // Fargelegg basert på Z-verdi (samme gradient som i parseXYZFile)
    const normalizedZ = (point.z - minZ) / zRange;
    const color = new THREE.Color();
    color.setHSL(0.6 - normalizedZ * 0.6, 1.0, 0.5); // Blå (0.6) til rød (0.0)
    colors.push(color.r, color.g, color.b);
  }
  
  return {
    positions,
    colors,
    count: tempPoints.length,
    bounds: {
      minX: baseX,
      maxX: baseX + sizeX,
      minY: baseY,
      maxY: baseY + sizeY,
      minZ: minZ,
      maxZ: maxZ
    }
  };
}