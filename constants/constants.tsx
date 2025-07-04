import { JSX } from 'react';
import { Image } from 'react-native';


export const icon: Record<string, (props: any) => JSX.Element> = {
    index: (props) => (
        <Image
            style={{ width: 25, height: 25, tintColor: props.color }}
            source={require('@/assets/navbarIcons/homeIcon.png')}
            {...props}
        /> 
    ),
   
    "pendingPayments/index": (props) => (
        <Image
            style={{ width: 25, height: 25, tintColor: props.color }}
            source={require('@/assets/navbarIcons/payUp.png')}
            {...props}
        /> 
    ),
   
};