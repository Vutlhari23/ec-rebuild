import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box
} from '@mui/material';
import { testAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await testAPI.getSubjects();
        setSubjects(response.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Available Subjects
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {subjects.map((subject) => (
          <Grid item xs={12} md={6} key={subject.id}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {subject.name}
                </Typography>
                <Typography color="textSecondary">
                  {subject.description || 'No description available'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="large"
                  onClick={() => navigate(`/subjects/${subject.id}/tests`)}
                >
                  View Tests
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {subjects.length === 0 && (
        <Typography variant="h6" textAlign="center" sx={{ mt: 4 }}>
          No subjects available at the moment.
        </Typography>
      )}
    </Container>
  );
};

export default Subjects;