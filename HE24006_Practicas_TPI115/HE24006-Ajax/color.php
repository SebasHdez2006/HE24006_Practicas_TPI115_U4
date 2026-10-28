<?php
if($_GET['c']>=1 && $_GET['c']<=3){
echo 'UD HA SELECCIONADO EL COLOR: ';
  if($_GET['c']==1)
    echo "<span style='color:white;background-color:black;'>blanco</span>";

  if($_GET['c']==2)
    echo "<span style='color:black;background-color:white;'>negro";

  if($_GET['c']==3)
    echo "<span style='color:red;background-color:white;'>rojo</span>";
}
else
 echo "UD HA COMETIDO UN ERROR AL DIGITAR EL VALOR";
 
?>