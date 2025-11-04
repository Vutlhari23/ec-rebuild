import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import { testAPI } from '../services/api';

const SubjectTests = () => {
  const { subjectId } = useParams();
  const [tests, setTests] = useState([]);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await testAPI.getTestsBySubject(subjectId);
        setTests(response.data);
        // In a real app, you might want to fetch subject details separately
        setSubject({ id: subjectId, name: 'Subject' }); // Placeholder
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [subjectId]);

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
        Available Tests
      </Typography>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Subject: {subject?.name}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {tests.map((test) => (
          <Grid item xs={12} md={6} key={test.id}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {test.title}
                </Typography>
                <Typography color="textSecondary" paragraph>
                  {test.description || 'No description available'}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`${test.duration_minutes} minutes`}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${test.total_marks} marks`}
                    size="small"
                    color="primary"
                  />
                </Box>
                <Typography variant="body2">
                  Questions: {test.questions?.length || 0}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="large"
                  variant="contained"
                  onClick={() => navigate(`/tests/${test.id}/take`)}
                >
                  Start Test
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {tests.length === 0 && (
        <Typography variant="h6" textAlign="center" sx={{ mt: 4 }}>
          No tests available for this subject.
        </Typography>
      )}
    </Container>
  );
};

export default SubjectTests;