import { authService } from '@/services';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

type Target = '/(routes)/login' | '/(routes)/area-selection';

export default function Index() {
    const [target, setTarget] = useState<Target | null>(null);

    useEffect(() => {
        let alive = true;
        authService
            .isAuthenticated()
            .then((ok) => alive && setTarget(ok ? '/(routes)/area-selection' : '/(routes)/login'))
            .catch(() => alive && setTarget('/(routes)/login'));
        return () => { alive = false; };
    }, []);

    if (!target) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#69bf70" />
            </View>
        );
    }
    return <Redirect href={target} />;
}
