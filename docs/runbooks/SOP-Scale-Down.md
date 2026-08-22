# SOP: Massive Scale-Down (Post-Exam)

**Severity**: Low (Routine)
**Symptoms**: 
- A massive university-wide coding exam has just concluded.
- The Kubernetes cluster has scaled out to 25 Compiler Workers and 15 Backend pods.
- CPU utilization across the cluster has dropped below 10%.

## Diagnosis
1. Verify the exam window is definitively over and there are no straggling submissions.
2. Check the Redis queue depth: `execution_queue_depth` should be exactly 0.
3. Check the active WebSocket connections on the backend: Should be returning to baseline (< 100).

## Resolution Steps
The Kubernetes Horizontal Pod Autoscaler (HPA) will automatically scale down pods after a cooldown period (default 5 minutes). However, to rapidly optimize costs for expensive Spot Instances, manual intervention is permitted.

1. **Verify HPA State**:
   ```bash
   kubectl get hpa -n production
   ```
2. **Graceful Termination**: Kubernetes will send a `SIGTERM` to the pods. Our Node.js backend handles this by rejecting new connections but finishing existing ones. No action is strictly required, but you can manually force the scale-down if the HPA is blocked:
   ```bash
   kubectl scale deployment mujcode-compiler-worker -n production --replicas=5
   kubectl scale deployment mujcode-backend -n production --replicas=3
   ```
3. **Verify Node Reclaim**: Ensure that the underlying AWS EKS Cluster Autoscaler reclaims the empty EC2 Spot Instances within 10 minutes to halt billing.
   ```bash
   kubectl get nodes
   ```
