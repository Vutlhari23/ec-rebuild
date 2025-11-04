import React from "react";
import { useAuth } from "../context/AuthContext.tsx";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome, {user?.full_name}!
      </Typography>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        Role: {user?.role}
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {user?.role === "student" && (
          <>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Take a Test
                  </Typography>
                  <Typography color="textSecondary">
                    Browse available subjects and tests to start your
                    examination.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="large" onClick={() => navigate("/subjects")}>
                    View Subjects
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    My Submissions
                  </Typography>
                  <Typography color="textSecondary">
                    View your previous test submissions and results.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="large"
                    onClick={() => navigate("/my-submissions")}
                  >
                    View Submissions
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </>
        )}

        {user?.role === "teacher" && (
          <>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Create Test
                  </Typography>
                  <Typography color="textSecondary">
                    Create new tests with multiple choice and coding questions.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="large" onClick={() => navigate("/create-test")}>
                    Create Test
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Manage Tests
                  </Typography>
                  <Typography color="textSecondary">
                    View and manage your created tests and student submissions.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="large">Manage Tests</Button>
                </CardActions>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
