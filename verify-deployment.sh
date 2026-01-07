#!/bin/bash

# Deployment Verification Script
# Dette scriptet verifiserer at deployment er riktig konfigurert

echo "🔍 Verifiserer deployment-konfigurasjon..."
echo ""

# Farger for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Sjekk 1: Workflow-fil eksisterer
echo -n "✓ Sjekker workflow-fil... "
if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FEIL${NC}"
    echo "  Workflow-filen mangler: .github/workflows/deploy.yml"
    ERRORS=$((ERRORS + 1))
fi

# Sjekk 2: Vite config har riktig base path
echo -n "✓ Sjekker vite.config.js... "
if [ -f "vite.config.js" ]; then
    # Extract repository name from git remote URL
    REPO_NAME=$(git config --get remote.origin.url | sed -e 's/.*\/\([^\/]*\)\.git/\1/' -e 's/.*\/\([^\/]*\)$/\1/')
    if [ -z "$REPO_NAME" ]; then
        REPO_NAME="Cursor-Tutorial"  # Fallback
    fi
    
    if grep -q "base: '/$REPO_NAME/'" vite.config.js; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}ADVARSEL${NC}"
        echo "  Base path i vite.config.js matcher ikke repository-navnet"
        echo "  Forventet: base: '/$REPO_NAME/'"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}FEIL${NC}"
    echo "  vite.config.js ikke funnet"
    ERRORS=$((ERRORS + 1))
fi

# Sjekk 3: package.json inneholder build script
echo -n "✓ Sjekker package.json... "
if [ -f "package.json" ]; then
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FEIL${NC}"
        echo "  Build script mangler i package.json"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}FEIL${NC}"
    echo "  package.json ikke funnet"
    ERRORS=$((ERRORS + 1))
fi

# Sjekk 4: .gitignore inneholder node_modules og dist
echo -n "✓ Sjekker .gitignore... "
if [ -f ".gitignore" ]; then
    if grep -q "node_modules" .gitignore && grep -q "dist" .gitignore; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${YELLOW}ADVARSEL${NC}"
        echo "  .gitignore mangler node_modules eller dist"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}ADVARSEL${NC}"
    echo "  .gitignore ikke funnet"
    WARNINGS=$((WARNINGS + 1))
fi

# Sjekk 5: Dokumentasjon finnes
echo -n "✓ Sjekker dokumentasjon... "
DOCS_OK=true
for doc in "README.md" "DEPLOYMENT.md" "QUICKSTART.md"; do
    if [ ! -f "$doc" ]; then
        DOCS_OK=false
        break
    fi
done

if $DOCS_OK; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}ADVARSEL${NC}"
    echo "  Noen dokumentasjonsfiler mangler"
    WARNINGS=$((WARNINGS + 1))
fi

# Sjekk 6: Node modules installert
echo -n "✓ Sjekker node_modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}ADVARSEL${NC}"
    echo "  node_modules ikke funnet. Kjør 'npm install'"
    WARNINGS=$((WARNINGS + 1))
fi

# Sjekk 7: Test build
echo -n "✓ Tester build... "
BUILD_OUTPUT=$(mktemp)
if npm run build > "$BUILD_OUTPUT" 2>&1; then
    echo -e "${GREEN}OK${NC}"
    # Cleanup build artifacts if they exist
    if [ -d "dist" ]; then
        rm -rf dist
    fi
else
    echo -e "${RED}FEIL${NC}"
    echo "  Build feilet. Se output nedenfor:"
    echo ""
    cat "$BUILD_OUTPUT"
    ERRORS=$((ERRORS + 1))
fi
rm -f "$BUILD_OUTPUT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Oppsummering
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Alt ser bra ut!${NC}"
    echo ""
    echo "Deployment er riktig konfigurert. Du kan nå:"
    echo "1. Push til main branch: git push origin main"
    echo "2. Eller trigger manuell deployment fra GitHub Actions"
    echo ""
    echo "Live site vil være tilgjengelig på:"
    echo "https://nilsae74.github.io/Cursor-Tutorial/"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Verifisering fullført med $WARNINGS advarsel(er)${NC}"
    echo ""
    echo "Deployment bør fungere, men det er noen advarsler."
    echo "Se detaljer over."
    exit 0
else
    echo -e "${RED}✗ Verifisering feilet med $ERRORS feil og $WARNINGS advarsel(er)${NC}"
    echo ""
    echo "Vennligst fiks feilene før du deployer."
    echo "Se DEPLOYMENT.md for mer informasjon."
    exit 1
fi
