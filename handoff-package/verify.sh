#!/bin/bash
# Post-deploy verification for madrassatalfath.com
# Usage: ./verify.sh <server-ip>

IP="${1:-198.54.114.177}"
APEX="madrassatalfath.com"
API="api.madrassatalfath.com"
fail=0

check() { # label expected actual
  if [ "$2" = "$3" ]; then
    printf "  PASS  %-28s %s\n" "$1" "$3"
  else
    printf "  FAIL  %-28s got %s, want %s\n" "$1" "$3" "$2"
    fail=1
  fi
}

echo "=== 1. DNS ==="
for h in "$APEX" "www.$APEX" "$API"; do
  ip=$(dig +short "$h" @8.8.8.8 | tail -1)
  check "$h resolves" "$IP" "$ip"
done

echo
echo "=== 2. Frontend vhost ==="
check "apex /"           200 "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $APEX" http://$IP/)"
check "apex /login"      200 "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $APEX" http://$IP/login)"
check "apex /admissions" 200 "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $APEX" http://$IP/admissions)"

body=$(curl -s -H "Host: $APEX" http://$IP/)
if echo "$body" | grep -q 'id="root"'; then
  echo "  PASS  apex serves the React build"
elif echo "$body" | grep -qi 'defaultwebpage\|cpanel'; then
  echo "  FAIL  apex is serving a cPanel placeholder, not the site"
  fail=1
else
  echo "  WARN  apex body unrecognised - inspect manually"
fi

echo
echo "=== 3. API vhost ==="
check "api /up"          200 "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $API" http://$IP/up)"
check "api /api/classes" 200 "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $API" http://$IP/api/classes)"

classes=$(curl -s -H "Host: $API" http://$IP/api/classes)
if echo "$classes" | grep -q '\"data\"\|\['; then
  echo "  PASS  /api/classes returned JSON"
else
  echo "  FAIL  /api/classes did not return JSON"
  fail=1
fi

echo
echo "=== 4. Protection (all must be 403/404) ==="
for spec in "apex /.env:$APEX:/.env" "apex /vendor:$APEX:/vendor" "api via apex:$APEX:/up"; do
  label="${spec%%:*}"; rest="${spec#*:}"; host="${rest%%:*}"; path="${rest#*:}"
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $host" "http://$IP$path")
  if [ "$code" = "403" ] || [ "$code" = "404" ]; then
    printf "  PASS  %-28s %s\n" "$label" "$code"
  else
    printf "  FAIL  %-28s %s (expected 403/404)\n" "$label" "$code"
    fail=1
  fi
done

echo
echo "=== 5. TLS ==="
for h in "$APEX" "$API"; do
  info=$(echo | openssl s_client -connect "$IP:443" -servername "$h" 2>/dev/null)
  subj=$(echo "$info" | grep -m1 '^subject=' | sed 's/.*CN *= *//;s/,.*//')
  ver=$(echo "$info" | grep -m1 'Verify return code')
  if echo "$subj" | grep -qi 'web-hosting'; then
    echo "  FAIL  $h generic hosting cert ($subj) - not valid for this domain"
    fail=1
  elif echo "$ver" | grep -q '(ok)'; then
    echo "  PASS  $h cert valid: $subj"
  else
    echo "  WARN  $h verify: $ver"
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "RESULT: all checks passed"
else
  echo "RESULT: failures present - see FAIL lines above"
fi
exit $fail
