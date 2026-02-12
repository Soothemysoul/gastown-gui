function iconForRole(role) {
  if (role === 'witness') return 'visibility';
  if (role === 'refinery') return 'merge_type';
  return 'engineering';
}

export class TargetService {
  constructor({ statusService } = {}) {
    if (!statusService?.getStatus) throw new Error('TargetService requires statusService.getStatus()');
    this._status = statusService;
  }

  async list({ refresh = false } = {}) {
    let status = null;
    try {
      status = await this._status.getStatus({ refresh });
    } catch {
      status = null;
    }

    const rigs = Array.isArray(status?.rigs) ? status.rigs : [];
    const targets = [];

    // Global agents
    targets.push({
      id: 'mayor',
      name: 'Mayor',
      type: 'global',
      icon: 'account_balance',
      description: 'Global coordinator - dispatches work across all projects',
    });
    targets.push({
      id: 'deacon',
      name: 'Deacon',
      type: 'global',
      icon: 'health_and_safety',
      description: 'Health monitor - can dispatch to dogs',
    });
    targets.push({
      id: 'deacon/dogs',
      name: 'Deacon Dogs',
      type: 'global',
      icon: 'pets',
      description: 'Auto-dispatch to an idle dog worker',
    });

    // Rigs (can spawn polecats)
    for (const rig of rigs) {
      if (!rig?.name) continue;

      targets.push({
        id: rig.name,
        name: rig.name,
        type: 'rig',
        icon: 'folder_special',
        description: `Auto-spawn polecat in ${rig.name}`,
      });

      // Existing agents in rig
      for (const agent of rig.agents || []) {
        if (!agent?.running) continue;
        targets.push({
          id: `${rig.name}/${agent.name}`,
          name: `${rig.name}/${agent.name}`,
          type: 'agent',
          role: agent.role,
          icon: iconForRole(agent.role),
          description: `${agent.role} in ${rig.name}`,
          running: agent.running,
          has_work: agent.has_work,
        });
      }
    }

    return targets;
  }
}

