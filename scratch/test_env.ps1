$files = Get-ChildItem "c:\Users\leoor\Documents\Proyectos\KikiMundialista\dist\assets\*.js"
foreach ($f in $files) {
    $c = Get-Content -Raw $f.FullName
    $idx = $c.IndexOf("AIzaSy")
    if ($idx -ge 0) {
        Write-Output "Found AIzaSy in $($f.Name) at index $idx"
        Write-Output "Context: $($c.Substring($idx, 150))"
    }
    
    $idx2 = $c.IndexOf("kikimundialista")
    if ($idx2 -ge 0) {
        Write-Output "Found kikimundialista in $($f.Name) at index $idx2"
        Write-Output "Context: $($c.Substring($idx2, 150))"
    }
}
