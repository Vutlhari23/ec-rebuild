import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { testAPI } from '../services/api';

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await testAPI.getMySubmissions();
        setSubmissions(response.data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
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
        My Submissions
      </Typography>

      {location.state?.message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {location.state.message}
        </Alert>
      )}

      {submissions.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" textAlign="center">
              No submissions yet. Take a test to see your results here!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Time Taken</TableCell>
                <TableCell>Marks Obtained</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      Test #{submission.test_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.submitted_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {submission.time_taken_minutes} minutes
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {submission.total_marks_obtained}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Completed"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MySubmissions;