import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import axios from 'axios';
import {
    confirmRegistration,
} from '../cognito';

export default function ConfirmationPage() {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Confirming your account...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const confirmUser = async () => {
            const username = searchParams.get('username');
            const code = searchParams.get('code');

            if (!username || !code) {
                setMessage('Invalid confirmation link. Missing parameters.');
                setLoading(false);
                return;
            }

            try {
                await confirmRegistration(username, code);
                
                try {
                    const res = await axios.put('http://localhost:9011/user-service/confirm', {
                        userId: username
                    });
                    setMessage(res.data.message || 'Your account has been confirmed!');
                } catch (backendErr) {
                    console.error('Backend update error:', backendErr);
                    setMessage(backendErr.response?.data?.message || 'User confirmed in Cognito, but failed to update DB.');
                }
            } catch (err) {
                console.error('Confirm error:', err);
                setMessage(err.message || 'Error confirming your account.');
            } finally {
                setLoading(false);
            }
        };

        confirmUser();
    }, [searchParams]);

    return (
        <Box sx={{ mt: 5, textAlign: 'center' }}>
            {loading ? (
                <CircularProgress />
            ) : (
                <Typography variant="h6">{message}</Typography>
            )}
        </Box>
    );
}
