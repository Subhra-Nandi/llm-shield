from locust import HttpUser, task, between

HEADERS = {"Authorization": "Bearer dev-master-key"}

class ShieldUser(HttpUser):
    wait_time = between(0.1, 0.5)

    @task(5)
    def health(self):
        """Tests the proxy is alive and fast"""
        self.client.get("/health")

    @task(3)
    def stats(self):
        """Tests the observability endpoint"""
        self.client.get("/stats")

    @task(2)
    def metrics(self):
        """Tests Prometheus metrics endpoint"""
        self.client.get("/metrics")