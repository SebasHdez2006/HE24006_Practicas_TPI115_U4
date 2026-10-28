<?php
echo "<option value='0'>Seleccione un Municipio</option>";
if($_GET['m']=='100') {
echo "<option value='1'>San Salvador</option>";
echo "<option value='2'>Aguilares</option>";
echo "<option value='3'>San Martin</option>";
}
else
if($_GET['m']=='200') {
echo "<option value='1'>Santa Ana</option>";
echo "<option value='2'>Chalchuapa</option>";
echo "<option value='3'>El Congo</option>";
}	
else
if($_GET['m']=='300') {
echo "<option value='1'>San Miguel</option>";
echo "<option value='2'>Chinameca</option>";
}
?>