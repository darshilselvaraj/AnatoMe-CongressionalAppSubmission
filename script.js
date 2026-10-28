document.addEventListener('DOMContentLoaded', function () {
    const accountEmail = localStorage.getItem('anatomeCurrentAccount');
    if (!accountEmail) {
        window.location.replace('login.html');
        return;
    }

    const accountStoragePrefix = 'anatomeAccountData.'
        + encodeURIComponent(accountEmail) + '.';

    // the standard Mobile Menu Toggle
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function () {
            navbarToggle.classList.toggle('is-active');
            navbarMenu.classList.toggle('is-active');
        });
    }

    // reads the saved progress and set up each module card
    const moduleCards = document.querySelectorAll('.module-card');
    const stepButtonLabels = [
        'Start warm-up quiz',
        'Continue to interactive game',
        'Start final quiz'
    ];
    let completedStepCount = 0;
    let totalStepCount = 0;

    moduleCards.forEach(function (card) {
        const steps = card.querySelectorAll('.step');
        const moduleId = card.dataset.moduleId;
        let nextStepIndex = steps.length;
        let completedStepsInModule = 0;

        steps.forEach(function (step, index) {
            let isDone = step.dataset.isDone === 'true';

            // module saves progress in the browser so it survives page changes
            if (moduleId) {
                const savedProgress = localStorage.getItem(
                    accountStoragePrefix + 'moduleProgress.' + moduleId + '.' + index
                );
                isDone = savedProgress === 'true';
            }

            step.dataset.isDone = String(isDone);
            const stepNumber = step.querySelector('.step__num');

            if (stepNumber) {
                stepNumber.classList.toggle('is-done', isDone);
            }

            totalStepCount++;
            if (isDone) {
                completedStepsInModule++;
                completedStepCount++;
            }

            if (!isDone && nextStepIndex === steps.length) {
                nextStepIndex = index;
            }
        });

        const completionLabel = card.querySelector('[data-module-completion]');
        if (completionLabel) {
            let completionPercent = 0;
            if (steps.length > 0) {
                completionPercent = completedStepsInModule / steps.length * 100;
            }

            const displayedPercent = completionPercent === 0 || completionPercent === 100
                ? completionPercent + '%'
                : completionPercent.toFixed(1) + '%';
            completionLabel.textContent = displayedPercent + ' complete';
            completionLabel.setAttribute('aria-label', displayedPercent + ' complete');
        }

        const gameXpLabel = card.querySelector('[data-game-xp]');
        if (gameXpLabel && moduleId) {
            const gameXp = Number(localStorage.getItem(
                accountStoragePrefix + 'moduleProgress.' + moduleId + '.gameXp'
            )) || 0;
            const gameStep = card.querySelectorAll('.step')[1];
            const gameIsComplete = gameStep && gameStep.dataset.isDone === 'true';
            gameXpLabel.hidden = !gameIsComplete || gameXp === 0;
            gameXpLabel.textContent = '+30 XP';
        }

        // Highlight the first step that is not done yet.
        steps.forEach(function (step, index) {
            step.classList.toggle('is-current', index === nextStepIndex);
        });

        const warmupScore = card.querySelector('[data-warmup-score]');
        if (warmupScore && moduleId) {
            const progressKey = accountStoragePrefix + 'moduleProgress.' + moduleId;
            const bestScore = localStorage.getItem(progressKey + '.warmupBestScore');
            const questionCount = localStorage.getItem(progressKey + '.warmupQuestionCount');

            if (bestScore === null) {
                warmupScore.textContent = steps[0].dataset.isDone === 'true'
                    ? 'Completed'
                    : 'Not completed';
            } else {
                warmupScore.textContent = bestScore + '/' + questionCount
                    + ' · ' + bestScore + ' XP';
            }
        }

        const finalScore = card.querySelector('[data-final-score]');
        if (finalScore && moduleId) {
            const progressKey = accountStoragePrefix + 'moduleProgress.' + moduleId;
            const savedScore = localStorage.getItem(progressKey + '.finalScore');
            const questionCount = localStorage.getItem(progressKey + '.finalQuestionCount');

            if (savedScore !== null && questionCount !== null) {
                finalScore.textContent = savedScore + '/' + questionCount
                    + ' · ' + savedScore + ' XP';
                finalScore.hidden = false;
            }
        }

        const moduleButton = card.querySelector('.module-card__button');
        if (moduleButton) {
            const hasContent = card.dataset.moduleContent === 'available';

            if (!hasContent) {
                moduleButton.textContent = 'Content coming soon';
                moduleButton.disabled = true;
            } else if (nextStepIndex >= steps.length) {
                moduleButton.textContent = 'Replay module';
                moduleButton.addEventListener('click', function () {
                    window.location.href = 'rundown.html?module='
                        + encodeURIComponent(moduleId)
                        + '&step=warmup';
                });
            } else {
                moduleButton.textContent = stepButtonLabels[nextStepIndex];
                moduleButton.addEventListener('click', function () {
                    let pageStep = 'warmup';

                    if (nextStepIndex === 1) {
                        pageStep = 'game';
                    } else if (nextStepIndex === 2) {
                        pageStep = 'final';
                    }

                    window.location.href = 'rundown.html?module='
                        + encodeURIComponent(moduleId)
                        + '&step=' + pageStep;
                });
            }
        }
    });

    const moduleProgress = document.getElementById('moduleProgress');
    const progressCount = document.getElementById('progressCount');
    const progressMessage = document.getElementById('progressMessage');

    function updateModuleProgress() {
        let progressPercent = 0;
        if (totalStepCount > 0) {
            progressPercent = completedStepCount / totalStepCount * 100;
        }

        moduleProgress.value = progressPercent;
        const displayedProgressPercent = Number.isInteger(progressPercent)
            ? progressPercent + '%'
            : progressPercent.toFixed(1) + '%';
        moduleProgress.setAttribute(
            'aria-label',
            'Module progress: ' + displayedProgressPercent + ' complete'
        );
        progressCount.textContent = 'Progress: ' + displayedProgressPercent + ' complete ('
            + completedStepCount + ' of ' + totalStepCount + ' steps)';
        progressMessage.textContent = progressPercent === 100
            ? 'All learning steps completed!'
            : 'Complete learning steps to increase your progress.';
    }
    updateModuleProgress();

    const resetProgressButton = document.getElementById('resetProgressButton');
    resetProgressButton.addEventListener('click', function () {
        const confirmed = window.confirm(
            'Reset all saved progress and XP? This cannot be undone.'
        );

        if (!confirmed) {
            return;
        }

        // Remove only the signed-in account's progress.
        const progressKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(accountStoragePrefix + 'moduleProgress.')) {
                progressKeys.push(key);
            }
        }

        progressKeys.forEach(function (key) {
            localStorage.removeItem(key);
        });
        localStorage.removeItem(accountStoragePrefix + 'completedModules');
        window.location.reload();
    });

    const profileButton = document.getElementById('profileButton');
    const profileMenu = document.getElementById('profileMenu');
    const signOutButton = document.getElementById('signOutButton');
    const accountDialog = document.getElementById('accountDialog');
    const accountDialogTitle = document.getElementById('accountDialogTitle');
    const accountDialogText = document.getElementById('accountDialogText');
    const closeAccountDialog = document.getElementById('closeAccountDialog');
    const accountRecord = JSON.parse(
        localStorage.getItem('anatomeAccount.' + encodeURIComponent(accountEmail)) || '{}'
    );

    profileButton.addEventListener('click', function () {
        profileMenu.hidden = !profileMenu.hidden;
        profileButton.setAttribute('aria-expanded', String(!profileMenu.hidden));
    });

    document.querySelectorAll('[data-account-view]').forEach(function (button) {
        button.addEventListener('click', function () {
            const bestScore = localStorage.getItem(
                accountStoragePrefix + 'moduleProgress.tissue-layers.warmupBestScore'
            ) || '0';
            const questionCount = localStorage.getItem(
                accountStoragePrefix + 'moduleProgress.tissue-layers.warmupQuestionCount'
            ) || '8';

            if (button.dataset.accountView === 'summary') {
                accountDialogTitle.textContent = 'My Account';
                accountDialogText.textContent = 'Welcome, ' + accountRecord.name
                    + '. Your best warm-up score is ' + bestScore + '/' + questionCount
                    + ', earning ' + bestScore + ' XP.';
            } else {
                accountDialogTitle.textContent = 'Account Details';
                accountDialogText.textContent = 'Name: ' + accountRecord.name
                    + ' | Email: ' + accountEmail;
            }

            profileMenu.hidden = true;
            profileButton.setAttribute('aria-expanded', 'false');
            accountDialog.showModal();
        });
    });

    closeAccountDialog.addEventListener('click', function () {
        accountDialog.close();
    });

    signOutButton.addEventListener('click', function () {
        localStorage.removeItem('anatomeCurrentAccount');
        window.location.href = 'login.html';
    });

    // --- Reveal on Scroll Up Logic ---
    const mainNavbar = document.getElementById('main-navbar');
    if (mainNavbar) {
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', function() {
            const currentScrollY = window.scrollY;
            const navbarHeight = mainNavbar.offsetHeight;

            // Hides the navbar if scrolling down and past the navbar height.
            // Shows the navbar if scrolling up or if at the very top of the page.
            if (currentScrollY > lastScrollY && currentScrollY > navbarHeight) {
                mainNavbar.classList.add('is-hidden');
            } else {
                mainNavbar.classList.remove('is-hidden');
            }

            // Update last scroll position for the next event
            lastScrollY = currentScrollY;
        });
    }
});