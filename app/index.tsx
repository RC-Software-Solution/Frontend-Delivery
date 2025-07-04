import { Redirect } from "expo-router";

export default function index() {
    return (
       <Redirect href={"/(routes)/login"} />
);
   
}
//<Redirect href={"/(routes)/login"} />
//<Redirect href={"/(tabs)"} />